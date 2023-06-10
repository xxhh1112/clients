import { Directive, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { Router } from "@angular/router";
import { Subject } from "rxjs";

import { DevicesApiServiceAbstraction } from "@bitwarden/common/abstractions/devices/devices-api.service.abstraction";
import { LoginService } from "@bitwarden/common/auth/abstractions/login.service";
import { TokenService } from "@bitwarden/common/auth/abstractions/token.service";
import { DeviceType } from "@bitwarden/common/enums/device-type.enum";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { AccountDecryptionOptions } from "@bitwarden/common/platform/models/domain/account";

@Directive()
export class BaseLoginDecryptionOptionsComponent implements OnInit, OnDestroy {
  private componentDestroyed$: Subject<void> = new Subject();

  userEmail: string = null;

  rememberDeviceForm = this.formBuilder.group({
    rememberDevice: [true],
  });

  loading = true;

  showApproveFromOtherDeviceBtn = false;
  showReqAdminApprovalBtn = false;
  showApproveWithMasterPasswordBtn = false;

  constructor(
    protected formBuilder: FormBuilder,
    protected devicesApiService: DevicesApiServiceAbstraction,
    protected stateService: StateService,
    protected router: Router,
    protected messagingService: MessagingService,
    protected tokenService: TokenService,
    protected loginService: LoginService
  ) {}

  async ngOnInit() {
    // Determine if the user has any mobile or desktop devices
    // to determine if we should show the approve from other device button
    const devicesListResponse = await this.devicesApiService.getDevices();
    for (const device of devicesListResponse.data) {
      if (
        device.type === DeviceType.Android ||
        device.type === DeviceType.iOS ||
        device.type === DeviceType.AndroidAmazon ||
        device.type === DeviceType.WindowsDesktop ||
        device.type === DeviceType.MacOsDesktop ||
        device.type === DeviceType.LinuxDesktop ||
        device.type === DeviceType.UWP
      ) {
        this.showApproveFromOtherDeviceBtn = true;
        break;
      }
    }

    const acctDecryptionOptions: AccountDecryptionOptions =
      await this.stateService.getAcctDecryptionOptions();

    // Get user's email from access token:
    this.userEmail = await this.tokenService.getEmail();

    // Show the admin approval btn if user has TDE enabled and the org admin approval policy is set && user email is not null
    this.showReqAdminApprovalBtn =
      !!acctDecryptionOptions.trustedDeviceOption?.hasAdminApproval && this.userEmail != null;

    this.showApproveWithMasterPasswordBtn = acctDecryptionOptions.hasMasterPassword;

    // TODO: do I extend the lock guard for the lock screen to prevent the user from getting to the lock screen
    // if they do not have a master password set

    this.loading = false;
  }

  approveFromOtherDevice() {
    // TODO: plan is to re-use existing login-with-device component but rework it to have two flows
    // (1) Standard flow for unauthN user based on AuthService status
    // (2) New flow for authN user based on AuthService status b/c they have just authenticated w/ SSO
    this.loginService.setEmail(this.userEmail);
    this.router.navigate(["/login-with-device"]);
  }

  requestAdminApproval() {
    // this.router.navigate(["/admin-approval-requested"]); // new component that doesn't exist yet
    // Idea: extract logic from the existing login-with-device component into a base-auth-request-component that
    // the new admin-approval-requested component and the existing login-with-device component can extend
    // TODO: how to do:
    // add create admin approval request on new OrganizationAuthRequestsController on the server
    // once https://github.com/bitwarden/server/pull/2993 is merged
    // Client will create an AuthRequest of type AdminAuthRequest WITHOUT orgId and send it to the server
    // Server will look up the org id(s) based on the user id and create the AdminAuthRequest(s)
    // Note: must lookup if the user has an account recovery key (resetPasswordKey) set in the org
    // (means they've opted into the Admin Acct Recovery feature)
    // Per discussion with Micah, fire out requests to all admins in any orgs the user is a member of
    // UNTIL the Admin Console team finishes their work to turn on Single Org policy when Admin Acct Recovery is enabled.
  }

  approveWithMasterPassword() {
    this.router.navigate(["/lock"]);
  }

  logOut() {
    this.loading = true; // to avoid an awkward delay in browser extension
    this.messagingService.send("logout");
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}

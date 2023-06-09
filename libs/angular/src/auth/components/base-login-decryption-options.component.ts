import { Directive, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { Router } from "@angular/router";
import { Subject } from "rxjs";

import { DevicesApiServiceAbstraction } from "@bitwarden/common/abstractions/devices/devices-api.service.abstraction";
import { DeviceType } from "@bitwarden/common/enums/device-type.enum";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { AccountDecryptionOptions } from "@bitwarden/common/platform/models/domain/account";

@Directive()
export class BaseLoginDecryptionOptionsComponent implements OnInit, OnDestroy {
  private componentDestroyed$: Subject<void> = new Subject();

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
    protected router: Router
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

    // Show the admin approval btn if user has TDE enabled and the org admin approval policy is set
    this.showReqAdminApprovalBtn = !!acctDecryptionOptions.trustedDeviceOption?.hasAdminApproval;

    this.showApproveWithMasterPasswordBtn = acctDecryptionOptions.hasMasterPassword;

    this.loading = false;
  }

  approveFromOtherDevice() {
    // this.devicesApiService.sendApproval();
  }

  requestAdminApproval() {
    // TODO: add create admin approval request on new OrganizationAuthRequestsController on the server
    // once https://github.com/bitwarden/server/pull/2993 is merged
    // Client with create an AdminAuthRequest without org id and send it to the server
    // Server will look up the org id(s) based on the user id and create the AdminAuthRequest(s)
    // Note: must lookup if the user has an account recovery key set in the org
    // (means they've opted into the Admin Acct Recovery feature)
    // Per discussion with Micah, fire out requests to all admins in any orgs the user is a member of
    // UNTIL the Admin Console team finishes their work to turn on Single Org policy when Admin Acct Recovery is enabled.
  }

  approveWithMasterPassword() {
    this.router.navigate(["lock"]);
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}

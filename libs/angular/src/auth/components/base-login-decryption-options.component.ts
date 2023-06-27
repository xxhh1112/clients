import { Directive, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { Router } from "@angular/router";
import { Observable, Subject, catchError, forkJoin, from, of, finalize, takeUntil } from "rxjs";

import { DevicesServiceAbstraction } from "@bitwarden/common/abstractions/devices/devices.service.abstraction";
import { LoginService } from "@bitwarden/common/auth/abstractions/login.service";
import {
  DesktopDeviceTypes,
  DeviceType,
  MobileDeviceTypes,
} from "@bitwarden/common/enums/device-type.enum";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { ValidationService } from "@bitwarden/common/platform/abstractions/validation.service";
import { AccountDecryptionOptions } from "@bitwarden/common/platform/models/domain/account";

@Directive()
export class BaseLoginDecryptionOptionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  showApproveFromOtherDeviceBtn: boolean;
  showReqAdminApprovalBtn: boolean;
  showApproveWithMasterPasswordBtn: boolean;
  userEmail: string;

  rememberDeviceForm = this.formBuilder.group({
    rememberDevice: [true],
  });

  loading = true;

  constructor(
    protected formBuilder: FormBuilder,
    protected devicesService: DevicesServiceAbstraction,
    protected stateService: StateService,
    protected router: Router,
    protected messagingService: MessagingService,
    protected loginService: LoginService,
    private validationService: ValidationService
  ) {}

  ngOnInit() {
    // Note: this is probably not a comprehensive write up of all scenarios:

    // If the TDE feature flag is enabled and TDE is configured for the org that the user is a member of,
    // then new and existing users can be redirected here after completing the SSO flow (and 2FA if enabled).

    // First we must determine user type (new or existing):

    // New User
    // - present user with option to remember the device or not (trust the device)
    // - present a continue button to proceed to the vault
    //  - loadNewUserData() --> will need to load enrollment status and user email address.

    // Existing User
    // - Determine if user is an admin with access to account recovery in admin console
    //  - Determine if user has a MP or not, if not, they must be redirected to set one (see PM-1035)
    // - Determine if device is trusted or not via device crypto service (method not yet written)
    //  - If not trusted, present user with login decryption options (approve from other device, approve with master password, request admin approval)
    //    - loadUntrustedDeviceData()

    this.loadUntrustedDeviceData();
  }

  loadUntrustedDeviceData() {
    this.loading = true;

    const mobileAndDesktopDeviceTypes: DeviceType[] = Array.from(MobileDeviceTypes).concat(
      Array.from(DesktopDeviceTypes)
    );

    // Note: Each obs must handle error here and protect inner observable b/c we are using forkJoin below
    // as per RxJs docs: if any given observable errors at some point, then
    // forkJoin will error as well and immediately unsubscribe from the other observables.
    const mobileOrDesktopDevicesExistence$ = this.devicesService
      .getDevicesExistenceByTypes$(mobileAndDesktopDeviceTypes)
      .pipe(
        catchError((err: unknown) => {
          this.validationService.showError(err);
          return of(undefined);
        }),
        takeUntil(this.destroy$)
      );

    const accountDecryptionOptions$: Observable<AccountDecryptionOptions> = from(
      this.stateService.getAccountDecryptionOptions()
    ).pipe(
      catchError((err: unknown) => {
        this.validationService.showError(err);
        return of(undefined);
      }),
      takeUntil(this.destroy$)
    );

    const email$ = from(this.stateService.getEmail()).pipe(
      catchError((err: unknown) => {
        this.validationService.showError(err);
        return of(undefined);
      }),
      takeUntil(this.destroy$)
    );

    forkJoin({
      mobileOrDesktopDevicesExistence: mobileOrDesktopDevicesExistence$,
      accountDecryptionOptions: accountDecryptionOptions$,
      email: email$,
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(({ mobileOrDesktopDevicesExistence, accountDecryptionOptions, email }) => {
        this.showApproveFromOtherDeviceBtn = mobileOrDesktopDevicesExistence || false;

        this.showReqAdminApprovalBtn =
          !!accountDecryptionOptions?.trustedDeviceOption?.hasAdminApproval || false;

        this.showApproveWithMasterPasswordBtn =
          accountDecryptionOptions?.hasMasterPassword || false;

        this.userEmail = email;
      });
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
    this.destroy$.next();
    this.destroy$.complete();
  }
}

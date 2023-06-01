import { Directive, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { Subject } from "rxjs";

import { DevicesApiServiceAbstraction } from "@bitwarden/common/abstractions/devices/devices-api.service.abstraction";
import { Policy } from "@bitwarden/common/admin-console/models/domain/policy";
import { DeviceType } from "@bitwarden/common/enums/device-type.enum";

@Directive()
export class BaseLoginDecryptionOptionsComponent implements OnInit, OnDestroy {
  private componentDestroyed$: Subject<void> = new Subject();

  rememberDeviceForm = this.formBuilder.group({
    rememberDevice: [true],
  });

  hasMobileOrDesktopDevice = false;

  orgMasterPasswordResetPolicy: Policy;

  constructor(
    protected formBuilder: FormBuilder,
    protected devicesApiService: DevicesApiServiceAbstraction
  ) {}

  async ngOnInit() {
    // User is authN via SSO or FIDO2 here

    // How do I know which org they user is logging into?
    // -- SSO - org SSO id entered during login, but what do we have post login?
    // --- we might have SSO org id and we need to get org id in order to filter policies
    // ------ I don't know when policies are loaded so might have to retrieve them

    // -- FIDO2 - what is FIDO2 login flow - Kyle & Andreas passkey work

    // Things to determine
    // showApproveFromOtherDeviceButton == hasMobileOrDesktopDevice
    // showRequestAdminApprovalButton == userInOrgWithTrustedDeviceEncryptionEnabled || userInOrgWithMasterPasswordResetPolicyEnabled

    // Has user opted into master password reset? - only applies to new users; old users can have MP still

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
        this.hasMobileOrDesktopDevice = true;
        break;
      }
    }
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}

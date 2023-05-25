import { Component } from "@angular/core";
import { FormBuilder } from "@angular/forms";

import { BaseLoginDecryptionOptionsComponent } from "@bitwarden/angular/auth/components/base-login-decryption-options.component";
import { DevicesApiServiceAbstraction } from "@bitwarden/common/abstractions/devices/devices-api.service.abstraction";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";

@Component({
  selector: "browser-login-decryption-options",
  templateUrl: "login-decryption-options.component.html",
})
export class LoginDecryptionOptionsComponent extends BaseLoginDecryptionOptionsComponent {
  constructor(
    formBuilder: FormBuilder,
    devicesApiService: DevicesApiServiceAbstraction,
    organizationService: OrganizationService,
    policyService: PolicyService
  ) {
    super(formBuilder, devicesApiService, organizationService, policyService);
  }
}

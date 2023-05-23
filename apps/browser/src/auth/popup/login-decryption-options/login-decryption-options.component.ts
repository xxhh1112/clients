import { Component } from "@angular/core";
import { FormBuilder } from "@angular/forms";

import { BaseLoginDecryptionOptionsComponent } from "@bitwarden/angular/auth/components/base-login-decryption-options.component";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";

@Component({
  selector: "browser-login-decryption-options",
  templateUrl: "login-decryption-options.component.html",
})
export class LoginDecryptionOptionsComponent extends BaseLoginDecryptionOptionsComponent {
  constructor(
    formBuilder: FormBuilder,
    apiService: ApiService,
    organizationService: OrganizationService,
    policyService: PolicyService
  ) {
    super(formBuilder, apiService, organizationService, policyService);
  }
}

import { Component, Input, OnDestroy, OnInit } from "@angular/core";

import { EmptyVaultComponent as BaseEmptyVaultComponent } from "@bitwarden/angular/vault/components/empty-vault.component";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { OrganizationUserService } from "@bitwarden/common/abstractions/organization-user/organization-user.service";
import { PolicyService } from "@bitwarden/common/abstractions/policy/policy.service.abstraction";
import { StateService } from "@bitwarden/common/abstractions/state.service";

@Component({
  selector: "app-empty-vault",
  templateUrl: "empty-vault.component.html",
})
export class EmptyVaultComponent extends BaseEmptyVaultComponent implements OnInit, OnDestroy {
  @Input() organizationId: string;
  @Input() activeFilter: any;

  constructor(
    policyService: PolicyService,
    organizationUserService: OrganizationUserService,
    i18nService: I18nService,
    stateService: StateService
  ) {
    super(policyService, organizationUserService, i18nService, stateService);
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  ngOnInit(): void {
    super.ngOnInit();
  }
}

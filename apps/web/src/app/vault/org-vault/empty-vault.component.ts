import { Component, Input, OnDestroy, OnInit } from "@angular/core";

import {
  EmptyVaultComponent as BaseEmptyVaultComponent,
  VaultType,
} from "@bitwarden/angular/vault/components/empty-vault.component";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { OrganizationUserService } from "@bitwarden/common/abstractions/organization-user/organization-user.service";
import { PolicyService } from "@bitwarden/common/abstractions/policy/policy.service.abstraction";
import { StateService } from "@bitwarden/common/abstractions/state.service";

import { EmptyVaultSafeIcon } from "../individual-vault/empty-vault/empty-vault-safe.icon";
import { VaultFilter } from "../individual-vault/vault-filter/shared/models/vault-filter.model";

@Component({
  selector: "app-empty-vault",
  templateUrl: "../individual-vault/empty-vault/empty-vault.component.html",
})
export class EmptyVaultComponent extends BaseEmptyVaultComponent implements OnInit, OnDestroy {
  @Input() activeFilter: VaultFilter;
  @Input() showAddNew = true;

  icon = EmptyVaultSafeIcon;

  constructor(
    policyService: PolicyService,
    organizationUserService: OrganizationUserService,
    i18nService: I18nService,
    stateService: StateService
  ) {
    super(policyService, organizationUserService, i18nService, stateService);
    super.vaultType = VaultType.Organization;
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  async ngOnInit(): Promise<void> {
    await super.ngOnInit();
  }
}

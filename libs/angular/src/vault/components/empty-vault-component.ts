import { Directive, Input } from "@angular/core";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { OrganizationUserService } from "@bitwarden/common/abstractions/organization-user/organization-user.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { OrganizationUserStatusType } from "@bitwarden/common/enums/organizationUserStatusType";

import { VaultFilterService } from "../vault-filter/services/vault-filter.service";

export enum VaultType {
  All = "all",
  Individual = "individual",
  Organization = "organization",
}

@Directive()
export class EmptyVaultComponent {
  @Input() organizationId: string;
  @Input() vaultType: VaultType;

  private userStatus: OrganizationUserStatusType;
  private activePersonalOwnershipPolicy: boolean;

  displayText: string;
  showImportButton: boolean;
  showCreateButton: boolean;

  individualText: string;
  organizationText: string;
  constructor(
    private vaultFilterService: VaultFilterService,
    private organizationUserService: OrganizationUserService,
    private i18nService: I18nService,
    private stateService: StateService
  ) {
    this.individualText = this.i18nService.t("noItemsVaultIndividual");
    this.organizationText = this.i18nService.t("noItemsVaultOrganization");
  }

  async checkPolicies() {
    this.activePersonalOwnershipPolicy =
      await this.vaultFilterService.checkForPersonalOwnershipPolicy();
    if (this.organizationId && this.vaultType === VaultType.Organization) {
      const userId = await this.stateService.getUserId();
      this.userStatus = (
        await this.organizationUserService.getOrganizationUser(this.organizationId, userId)
      ).status;
    }
  }

  async setupCases() {
    await this.checkPolicies();

    this.showImportButton = false;
    this.showCreateButton = false;

    switch (this.vaultType) {
      case VaultType.Individual:
        this.setupForIndividualVault();
        break;
      case VaultType.All:
      case VaultType.Organization:
        this.setupForOrganizationVault();
        break;
    }
  }

  setupForIndividualVault() {
    this.displayText = this.individualText;
    if (!this.activePersonalOwnershipPolicy) {
      this.showImportButton = true;
      this.showCreateButton = true;
    }
  }

  setupForOrganizationVault() {
    switch (this.userStatus) {
      case OrganizationUserStatusType.Accepted:
        this.displayText = this.organizationText;
        if (this.activePersonalOwnershipPolicy) {
          this.showImportButton = false;
          this.showCreateButton = false;
        } else {
          this.showImportButton = true;
          this.showCreateButton = true;
        }
        break;
      case OrganizationUserStatusType.Confirmed:
        this.displayText = this.individualText;
        if (this.activePersonalOwnershipPolicy) {
          this.showImportButton = false;
          this.showCreateButton = true;
        } else {
          this.showImportButton = true;
          this.showCreateButton = true;
        }
        break;
    }
  }
}

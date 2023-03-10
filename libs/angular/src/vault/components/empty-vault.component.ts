import { Directive, Input, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "@microsoft/signalr/dist/esm/Subject";
import { firstValueFrom } from "rxjs";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { OrganizationUserService } from "@bitwarden/common/abstractions/organization-user/organization-user.service";
import { PolicyService } from "@bitwarden/common/abstractions/policy/policy.service.abstraction";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { OrganizationUserStatusType } from "@bitwarden/common/enums/organizationUserStatusType";
import { PolicyType } from "@bitwarden/common/enums/policyType";

export enum VaultType {
  All = "all",
  Individual = "individual",
  Organization = "organization",
}

@Directive()
export class EmptyVaultComponent implements OnInit, OnDestroy {
  @Input() organizationId: string;
  @Input() vaultType: VaultType;

  protected destroy$ = new Subject<void>();
  private userStatus: OrganizationUserStatusType;
  private activePersonalOwnershipPolicy: boolean;

  displayText: string;
  showImportButton: boolean;
  showCreateButton: boolean;

  individualText: string;
  organizationText: string;
  constructor(
    private policyService: PolicyService,
    private organizationUserService: OrganizationUserService,
    private i18nService: I18nService,
    private stateService: StateService
  ) {
    this.individualText = this.i18nService.t("noItemsVaultIndividual");
    this.organizationText = this.i18nService.t("noItemsVaultOrganization");
  }

  ngOnInit(): void {
    this.setupCases();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async checkPolicies() {
    this.activePersonalOwnershipPolicy = await firstValueFrom(
      this.policyService.policyAppliesToActiveUser$(PolicyType.PersonalOwnership)
    );
    if (this.organizationId && this.vaultType === VaultType.Organization) {
      const userId = await this.stateService.getUserId();
      // TODO: is this the best way to grab org user information? It's an api call every time.
      this.userStatus = (
        await this.organizationUserService.getOrganizationUser(this.organizationId, userId)
      ).status;
    }
  }

  async setupCases() {
    await this.checkPolicies();

    this.showImportButton = this.showCreateButton = false;

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
      this.showImportButton = this.showCreateButton = true;
    }
  }

  setupForOrganizationVault() {
    switch (this.userStatus) {
      case OrganizationUserStatusType.Accepted:
        this.displayText = this.organizationText;
        if (!this.activePersonalOwnershipPolicy) {
          this.showImportButton = this.showCreateButton = true;
        }
        break;
      case OrganizationUserStatusType.Confirmed:
        this.displayText = this.individualText;
        if (this.activePersonalOwnershipPolicy) {
          this.showImportButton = false;
          this.showCreateButton = true;
        } else {
          this.showImportButton = this.showCreateButton = true;
        }
        break;
    }
  }
}

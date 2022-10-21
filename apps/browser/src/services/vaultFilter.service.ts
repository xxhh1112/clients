import { VaultFilter } from "@bitwarden/angular/vault/vault-filter/models/vault-filter.model";
import { VaultFilterService as BaseVaultFilterService } from "@bitwarden/angular/vault/vault-filter/services/vault-filter.service";
import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { FolderService } from "@bitwarden/common/abstractions/folder/folder.service.abstraction";
import { OrganizationService } from "@bitwarden/common/abstractions/organization/organization.service.abstraction";
import { PolicyService } from "@bitwarden/common/abstractions/policy/policy.service.abstraction";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { CipherView } from "@bitwarden/common/models/view/cipher.view";

export class VaultFilterService extends BaseVaultFilterService {
  vaultFilter: VaultFilter = new VaultFilter();

  allVaults = "allVaults";
  myVault = "myVault";
  firstLoad = true;

  constructor(
    stateService: StateService,
    organizationService: OrganizationService,
    folderService: FolderService,
    cipherService: CipherService,
    collectionService: CollectionService,
    policyService: PolicyService
  ) {
    super(
      stateService,
      organizationService,
      folderService,
      cipherService,
      collectionService,
      policyService
    );
    this.vaultFilter.myVaultOnly = false;
    this.vaultFilter.selectedOrganizationId = null;
  }

  async loadSavedVaultFilter() {
    const savedFilter = await this.stateService.getVaultFilter();
    await this.setVaultFilter(savedFilter);
    this.firstLoad = false;
  }

  async getVaultFilter() {
    if (this.firstLoad === true) {
      await this.loadSavedVaultFilter();
    }
    return this.vaultFilter;
  }

  async setVaultFilter(filter: string) {
    if (filter === this.allVaults) {
      this.vaultFilter.myVaultOnly = false;
      this.vaultFilter.selectedOrganizationId = null;
    } else if (filter === this.myVault) {
      this.vaultFilter.myVaultOnly = true;
      this.vaultFilter.selectedOrganizationId = null;
    } else {
      this.vaultFilter.myVaultOnly = false;
      this.vaultFilter.selectedOrganizationId = filter;
    }
    await this.stateService.setVaultFilter(filter);
  }

  clear() {
    this.setVaultFilter(this.allVaults);
  }

  filterCipherForSelectedVault(cipher: CipherView) {
    if (!this.vaultFilter.selectedOrganizationId && !this.vaultFilter.myVaultOnly) {
      return false;
    }
    if (this.vaultFilter.selectedOrganizationId) {
      if (cipher.organizationId === this.vaultFilter.selectedOrganizationId) {
        return false;
      }
    } else if (this.vaultFilter.myVaultOnly) {
      if (!cipher.organizationId) {
        return false;
      }
    }
    return true;
  }
}

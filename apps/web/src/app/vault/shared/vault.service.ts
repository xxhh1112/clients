import { VaultFilter } from "@bitwarden/angular/vault/vault-filter/models/vault-filter.model";

export class VaultService {
  calculateSearchBarLocalizationString(vaultFilter: VaultFilter): string {
    if (vaultFilter.selectedCipherTypeNode?.node.type === "favorites") {
      return "searchFavorites";
    }
    if (vaultFilter.selectedCipherTypeNode?.node.type === "trash") {
      return "searchTrash";
    }
    if (
      vaultFilter.selectedCipherTypeNode?.node.type != null &&
      vaultFilter.selectedCipherTypeNode?.node.type !== "all"
    ) {
      return "searchType";
    }
    if (vaultFilter.selectedFolderNode?.node) {
      return "searchFolder";
    }
    if (vaultFilter.selectedCollectionNode?.node.id) {
      return "searchCollection";
    }
    if (vaultFilter.selectedOrganizationNode?.node.id === "MyVault") {
      return "searchMyVault";
    }
    if (vaultFilter.selectedOrganizationNode?.node.id) {
      return "searchOrganization";
    }

    return "searchVault";
  }
}

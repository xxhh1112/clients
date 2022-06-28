import { VaultFilter } from "@bitwarden/angular/modules/vault-filter/models/vault-filter.model";

export class VaultService {
  calculateSearchBarLocalizationString(vaultFilter: VaultFilter): string {
    if (vaultFilter.status === "favorites") {
      return "searchFavorites";
    }
    if (vaultFilter.status === "trash") {
      return "searchTrash";
    }
    if (vaultFilter.type != null) {
      return "searchType";
    }
    if (vaultFilter.folderId != null && vaultFilter.folderId !== VaultFilter.Unassigned) {
      return "searchFolder";
    }
    if (vaultFilter.collectionId != null && vaultFilter.collectionId !== VaultFilter.Unassigned) {
      return "searchCollection";
    }
    if (
      vaultFilter.organizationId != null &&
      vaultFilter.organizationId !== VaultFilter.Unassigned
    ) {
      return "searchOrganization";
    }
    if (vaultFilter.organizationId === VaultFilter.Unassigned) {
      return "searchMyVault";
    }

    return "searchVault";
  }
}

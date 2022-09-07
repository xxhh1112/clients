import { CipherTypeFilter } from "@bitwarden/angular/vault/vault-filter/models/cipher-filter.model";
import { CollectionFilter } from "@bitwarden/angular/vault/vault-filter/models/collection-filter.model";
import { FolderFilter } from "@bitwarden/angular/vault/vault-filter/models/folder-filter.model";
import { OrganizationFilter } from "@bitwarden/angular/vault/vault-filter/models/organization-filter.model";
import { CipherType } from "@bitwarden/common/enums/cipherType";
import { TreeNode } from "@bitwarden/common/models/domain/treeNode";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

export type VaultFilterFunction = (cipher: CipherView) => boolean;

// TODO: Replace shared VaultFilter Model with this one and
// refactor browser and desktop code to use this model.
export class VaultFilter {
  selectedOrganizationNode: TreeNode<OrganizationFilter>;
  selectedCipherTypeNode: TreeNode<CipherTypeFilter>;
  selectedFolderNode: TreeNode<FolderFilter>;
  selectedCollectionNode: TreeNode<CollectionFilter>;

  get isFavorites(): boolean {
    return this.selectedCipherTypeNode?.node.type === "favorites";
  }

  get isDeleted(): boolean {
    return this.selectedCipherTypeNode?.node.type === "trash" ? true : null;
  }

  get getCipherType(): CipherType {
    return this.selectedCipherTypeNode?.node.type in CipherType
      ? (this.selectedCipherTypeNode?.node.type as CipherType)
      : null;
  }

  get getCipherTypeId(): string {
    return this.selectedCipherTypeNode?.node.id;
  }

  get getFolderId(): string {
    return this.selectedFolderNode?.node.id;
  }

  get getCollectionId(): string {
    return this.selectedCollectionNode?.node.id;
  }

  constructor(init?: Partial<VaultFilter>) {
    Object.assign(this, init);
  }

  resetFilter() {
    this.selectedCipherTypeNode = null;
    this.selectedFolderNode = null;
    this.selectedCollectionNode = null;
  }

  resetOrganization() {
    this.selectedOrganizationNode = null;
  }

  buildFilter(): VaultFilterFunction {
    return (cipher) => {
      let cipherPassesFilter = true;
      if (this.selectedCipherTypeNode) {
        if (this.selectedCipherTypeNode.node.type === "favorites" && cipherPassesFilter) {
          cipherPassesFilter = cipher.favorite;
        } else if (this.selectedCipherTypeNode.node.type === "trash" && cipherPassesFilter) {
          cipherPassesFilter = cipher.isDeleted;
        } else if (this.selectedCipherTypeNode.node.type != "all" && cipherPassesFilter) {
          cipherPassesFilter = cipher.type === this.selectedCipherTypeNode.node.type;
        }
      }
      if (this.selectedFolderNode) {
        // No folder
        if (this.selectedFolderNode.node.id == null && cipherPassesFilter) {
          cipherPassesFilter = cipher.folderId == null;
        }
        // Folder
        if (this.selectedFolderNode.node.id != null && cipherPassesFilter) {
          cipherPassesFilter = cipher.folderId === this.selectedFolderNode.node.id;
        }
      }
      if (this.selectedCollectionNode) {
        // All Collections
        if (this.selectedCollectionNode.node.id === "AllCollections" && cipherPassesFilter) {
          cipherPassesFilter = false;
        }
        // Unassigned
        if (this.selectedCollectionNode.node.id == null && cipherPassesFilter) {
          cipherPassesFilter =
            cipher.organizationId != null &&
            (cipher.collectionIds == null || cipher.collectionIds.length === 0);
        }
        // Collection
        if (this.selectedCollectionNode.node.id != null && cipherPassesFilter) {
          cipherPassesFilter =
            cipher.collectionIds != null &&
            cipher.collectionIds.includes(this.selectedCollectionNode.node.id);
        }
      }
      if (this.selectedOrganizationNode) {
        // My Vault
        if (this.selectedOrganizationNode.node.id === "MyVault" && cipherPassesFilter) {
          cipherPassesFilter = cipher.organizationId === null;
        }
        // Organization
        else if (this.selectedOrganizationNode.node.id != null && cipherPassesFilter) {
          cipherPassesFilter = cipher.organizationId === this.selectedOrganizationNode.node.id;
        }
      }
      return cipherPassesFilter;
    };
  }
}

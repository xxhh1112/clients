import { TreeNode } from "@bitwarden/common/models/domain/treeNode";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

import { CipherTypeFilter } from "./cipher-filter.model";
import { CollectionFilter } from "./collection-filter.model";
import { FolderFilter } from "./folder-filter.model";
import { OrganizationFilter } from "./organization-filter.model";

export type VaultFilterFunction = (cipher: CipherView) => boolean;

export class VaultFilter {
  selectedOrganizationNode: TreeNode<OrganizationFilter>;
  selectedCipherTypeNode: TreeNode<CipherTypeFilter>;
  selectedFolderNode: TreeNode<FolderFilter>;
  selectedCollectionNode: TreeNode<CollectionFilter>;

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

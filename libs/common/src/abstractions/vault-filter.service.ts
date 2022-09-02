import { Observable } from "rxjs";

import { CipherTypeFilter } from "@bitwarden/angular/src/vault/vault-filter/models/cipher-filter.model";
import { FolderFilter } from "@bitwarden/angular/src/vault/vault-filter/models/folder-filter.model";
import { OrganizationFilter } from "@bitwarden/angular/src/vault/vault-filter/models/organization-filter.model";
import { CollectionFilter } from "@bitwarden/angular/vault/vault-filter/models/collection-filter.model";
import { DynamicTreeNode } from "@bitwarden/angular/vault/vault-filter/models/dynamic-tree-node.model";

import { Organization } from "../models/domain/organization";
import { TreeNode } from "../models/domain/treeNode";
import { CollectionView } from "../models/view/collectionView";
import { FolderView } from "../models/view/folderView";

export abstract class VaultFilterService {
  collapsedFilterNodes$: Observable<Set<string>>;
  filteredFolders$: Observable<FolderView[]>;
  filteredCollections$: Observable<CollectionView[]>;
  nestedFolders$: Observable<TreeNode<FolderFilter>>;
  nestedCollections$: Observable<TreeNode<CollectionFilter>>;
  reloadCollections: () => Promise<void>;
  buildCollapsedFilterNodes: () => Promise<Set<string>>;
  storeCollapsedFilterNodes: (collapsedFilterNodes: Set<string>) => Promise<void>;
  ensureVaultFiltersAreExpanded: () => Promise<void>;
  updateOrganizationFilter: (organization: Organization) => void;
  buildNestedOrganizations: () => Promise<Observable<TreeNode<OrganizationFilter>>>;
  buildNestedTypes: (
    head: CipherTypeFilter,
    array: CipherTypeFilter[]
  ) => Observable<TreeNode<CipherTypeFilter>>;
  buildNestedTrash: () => Observable<TreeNode<CipherTypeFilter>>;
  getNestedFolder: (id: string) => Promise<TreeNode<FolderFilter>>;
  getNestedCollection: (id: string) => Promise<TreeNode<CollectionFilter>>;
  checkForSingleOrganizationPolicy: () => Promise<boolean>;
  checkForPersonalOwnershipPolicy: () => Promise<boolean>;
}

/**
 * @deprecated August 30 2022: Use new VaultFilterService with observables
 */
export abstract class DeprecatedVaultFilterService {
  buildOrganizations: () => Promise<Organization[]>;
  buildNestedFolders: (organizationId?: string) => Observable<DynamicTreeNode<FolderView>>;
  buildCollections: (organizationId?: string) => Promise<DynamicTreeNode<CollectionView>>;
  buildCollapsedFilterNodes: () => Promise<Set<string>>;
  storeCollapsedFilterNodes: (collapsedFilterNodes: Set<string>) => Promise<void>;
  checkForSingleOrganizationPolicy: () => Promise<boolean>;
  checkForPersonalOwnershipPolicy: () => Promise<boolean>;
}

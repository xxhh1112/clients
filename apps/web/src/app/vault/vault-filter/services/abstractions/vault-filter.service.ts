import { Observable } from "rxjs";

import { Organization } from "@bitwarden/common/src/models/domain/organization";
import { TreeNode } from "@bitwarden/common/src/models/domain/treeNode";
import { CollectionView } from "@bitwarden/common/src/models/view/collectionView";
import { FolderView } from "@bitwarden/common/src/models/view/folderView";

import {
  FolderFilter,
  CollectionFilter,
  OrganizationFilter,
  CipherTypeFilter,
} from "../../shared/models/vault-filter.type";

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

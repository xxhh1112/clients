import { Observable } from "rxjs";

import {
  CipherTypeFilter,
  FolderFilter,
  OrganizationFilter,
  CollectionFilter,
} from "@bitwarden/angular/src/vault/vault-filter/models/vault-filter.type";

import { Organization } from "../../../common/src/models/domain/organization";
import { TreeNode } from "../../../common/src/models/domain/treeNode";
import { CollectionView } from "../../../common/src/models/view/collectionView";
import { FolderView } from "../../../common/src/models/view/folderView";

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

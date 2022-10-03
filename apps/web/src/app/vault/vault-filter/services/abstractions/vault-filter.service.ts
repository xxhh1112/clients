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
  organizationTree$: Observable<TreeNode<OrganizationFilter>>;
  folderTree$: Observable<TreeNode<FolderFilter>>;
  collectionTree$: Observable<TreeNode<CollectionFilter>>;
  reloadCollections: () => Promise<void>;
  storeCollapsedFilterNodes: (collapsedFilterNodes: Set<string>) => Promise<void>;
  expandOrgFilter: () => Promise<void>;
  updateOrganizationFilter: (organization: Organization) => void;
  buildTypeTree: (
    head: CipherTypeFilter,
    array: CipherTypeFilter[]
  ) => Observable<TreeNode<CipherTypeFilter>>;
}

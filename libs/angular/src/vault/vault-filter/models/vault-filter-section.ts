import { Organization } from "@bitwarden/common/models/domain/organization";
import { TreeNode } from "@bitwarden/common/models/domain/treeNode";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";
import { FolderView } from "@bitwarden/common/models/view/folderView";

import { CipherFilter } from "./cipher-filter.model";
import { VaultFilter } from "./vault-filter.model";

export type VaultFilterType = Organization | CipherFilter | FolderView | CollectionView;

export type VaultFilterSection = {
  tree: TreeNode<VaultFilterType>;
  action: (model: VaultFilter, filter: VaultFilterType) => VaultFilter;
  edit: {
    enabled: boolean;
    icon: string;
    action: (filter: VaultFilterType) => void;
  };
  add: {
    enabled: boolean;
    icon: string;
    action: () => void;
  };
};

import { SelectionReadOnlyRequest } from "@bitwarden/common/models/request/selectionReadOnlyRequest";
import { CipherType } from "@bitwarden/common/src/enums/cipherType";
import { Organization } from "@bitwarden/common/src/models/domain/organization";
import { ITreeNodeObject } from "@bitwarden/common/src/models/domain/treeNode";
import { CollectionView } from "@bitwarden/common/src/models/view/collectionView";
import { FolderView } from "@bitwarden/common/src/models/view/folderView";

export type CipherStatus = "all" | "favorites" | "trash" | CipherType;

export type CipherTypeFilter = ITreeNodeObject & { type: CipherStatus; icon: string };
export type CollectionFilter = CollectionView & {
  icon: string;
  groups: SelectionReadOnlyRequest[];
};
export type FolderFilter = FolderView & { icon: string };
export type OrganizationFilter = Organization & { icon: string; hideOptions?: boolean };

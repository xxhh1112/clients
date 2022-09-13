import { CipherType } from "@bitwarden/common/enums/cipherType";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { ITreeNodeObject } from "@bitwarden/common/models/domain/treeNode";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";
import { FolderView } from "@bitwarden/common/models/view/folderView";

export type CipherStatus = "all" | "favorites" | "trash" | CipherType;

export type CipherTypeFilter = ITreeNodeObject & { type: CipherStatus; icon: string };
export type CollectionFilter = CollectionView & { icon: string };
export type FolderFilter = FolderView & { icon: string };
export type OrganizationFilter = Organization & { icon: string; hideOptions?: boolean };

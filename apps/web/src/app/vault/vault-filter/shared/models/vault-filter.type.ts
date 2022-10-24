import { CipherType } from "@bitwarden/common/src/enums/cipherType";
import { Organization } from "@bitwarden/common/src/models/domain/organization";
import { ITreeNodeObject } from "@bitwarden/common/src/models/domain/tree-node";
import { CollectionView } from "@bitwarden/common/src/models/view/collection.view";
import { FolderView } from "@bitwarden/common/src/models/view/folder.view";

export type CipherStatus = "all" | "favorites" | "trash" | CipherType;

export type CipherTypeFilter = ITreeNodeObject & { type: CipherStatus; icon: string };
export type CollectionFilter = CollectionView & { icon: string };
export type FolderFilter = FolderView & { icon: string };
export type OrganizationFilter = Organization & { icon: string; hideOptions?: boolean };

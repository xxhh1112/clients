import { CipherType } from "@bitwarden/common/enums/cipherType";
import { ITreeNodeObject } from "@bitwarden/common/models/domain/treeNode";

export type CipherStatus = "all" | "favorites" | "trash" | CipherType;
export type CipherTypeFilter = ITreeNodeObject & { type: CipherStatus; icon: string };

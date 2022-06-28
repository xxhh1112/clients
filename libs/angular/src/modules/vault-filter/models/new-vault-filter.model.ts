import { CipherType } from "@bitwarden/common/enums/cipherType";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

import { CipherStatus } from "./cipher-status.model";

export const Unassigned: unique symbol = Symbol("Unassigned");

const DefaultOptions: VaultFilterOptions = {
  cipherStatus: "all",
  cipherType: null,
  folder: null,
};

export type VaultFilterOptions = Readonly<{
  cipherStatus: CipherStatus;
  cipherType?: CipherType;
  folder?: string | typeof Unassigned;
}>;

export type VaultFilterFunction = (cipher: CipherView) => boolean;

export class VaultFilter implements VaultFilterOptions {
  private readonly options: VaultFilterOptions;

  constructor(options: Partial<VaultFilterOptions> = {}) {
    this.options = {
      ...DefaultOptions,
      ...options,
    };
  }

  get cipherStatus() {
    return this.options.cipherStatus;
  }

  get cipherType() {
    return this.options.cipherType;
  }

  get folder() {
    return this.options.folder;
  }

  get filterFunction(): VaultFilterFunction {
    return (cipher) => {
      const status =
        this.cipherStatus === "all" ||
        (this.cipherStatus === "favorites" && cipher.favorite) ||
        (this.cipherStatus === "trash" && cipher.isDeleted);

      const type =
        this.cipherType == null || (this.cipherType != null && this.cipherType === cipher.type);

      const folder =
        this.folder == null ||
        (this.folder === Unassigned && cipher.folderId == null) ||
        (this.folder != null && this.folder === cipher.folderId);

      return status && type && folder;
    };
  }

  update(options: Partial<VaultFilterOptions>) {
    return new VaultFilter({
      ...this.options,
      ...options,
    });
  }
}

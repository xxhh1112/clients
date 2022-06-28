import { CipherType } from "@bitwarden/common/enums/cipherType";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

import { CipherStatus } from "./cipher-status.model";

const DefaultOptions: VaultFilterOptions = {
  cipherStatus: "all",
  cipherType: null,
  selectedFolder: false,
};

export type VaultFilterOptions = Readonly<{
  cipherStatus: CipherStatus;
  cipherType?: CipherType;
  selectedFolder: boolean;
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

  get selectedFolder() {
    return this.options.selectedFolder;
  }

  get filterFunction(): VaultFilterFunction {
    return (cipher) => {
      const status =
        this.cipherStatus === "all" ||
        (this.cipherStatus === "favorites" && cipher.favorite) ||
        (this.cipherStatus === "trash" && cipher.isDeleted);

      const type =
        this.cipherType == null || (this.cipherType != null && this.cipherType === cipher.type);

      return status && type;
    };
  }

  update(options: Partial<VaultFilterOptions>) {
    return new VaultFilter({
      ...this.options,
      ...options,
    });
  }
}

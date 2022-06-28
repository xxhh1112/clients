import { CipherView } from "@bitwarden/common/models/view/cipherView";

import { CipherStatus } from "./cipher-status.model";

const DefaultOptions: VaultFilterOptions = {
  cipherStatus: "all",
  selectedFolder: false,
};

export type VaultFilterOptions = Readonly<{
  cipherStatus: CipherStatus;
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

  get selectedFolder() {
    return this.options.selectedFolder;
  }

  get filterFunction(): VaultFilterFunction {
    return (cipher) => {
      return (
        this.cipherStatus === "all" ||
        (this.cipherStatus === "favorites" && cipher.favorite) ||
        (this.cipherStatus === "trash" && cipher.isDeleted)
      );
    };
  }

  update(options: Partial<VaultFilterOptions>) {
    return new VaultFilter({
      ...this.options,
      ...options,
    });
  }
}

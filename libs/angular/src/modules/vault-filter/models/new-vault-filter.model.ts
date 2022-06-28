import { CipherView } from "@bitwarden/common/models/view/cipherView";

import { CipherStatus } from "./cipher-status.model";

const DefaultOptions: VaultFilterOptions = {
  status: "all",
  selectedFolder: false,
};

export type VaultFilterOptions = Readonly<{
  status: CipherStatus;
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

  get status() {
    return this.options.status;
  }

  get selectedFolder() {
    return this.options.selectedFolder;
  }

  get filterFunction(): VaultFilterFunction {
    return () => true;
  }

  update(options: Partial<VaultFilterOptions>) {
    return new VaultFilter({
      ...this.options,
      ...options,
    });
  }
}

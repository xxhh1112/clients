import { CipherType } from "@bitwarden/common/enums/cipherType";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

import { CipherStatus } from "./cipher-status.model";

export const Unassigned: unique symbol = Symbol("Unassigned");

const DefaultOptions: VaultFilterOptions = {
  cipherStatus: "all",
  cipherType: null,
  folder: null,
  collection: null,
  organization: null,
};

export type VaultFilterOptions = Readonly<{
  cipherStatus: CipherStatus;
  cipherType?: CipherType;
  folder?: string | typeof Unassigned;
  collection?: string | typeof Unassigned;
  organization?: string;
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

  get collection() {
    return this.options.collection;
  }

  get organization() {
    return this.options.organization;
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

      const collection =
        this.collection == null ||
        (this.collection === Unassigned &&
          (cipher.collectionIds == null || cipher.collectionIds.length === 0)) ||
        (this.collection != null &&
          this.collection !== Unassigned &&
          cipher.collectionIds != null &&
          cipher.collectionIds.includes(this.collection));

      const organization =
        this.organization == null ||
        (this.organization != null && this.organization === cipher.organizationId);

      return status && type && folder && collection && organization;
    };
  }

  update(options: Partial<VaultFilterOptions>) {
    return new VaultFilter({
      ...this.options,
      ...options,
    });
  }
}

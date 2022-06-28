import { CipherType } from "@bitwarden/common/enums/cipherType";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

import { CipherStatus } from "./cipher-status.model";

const DefaultOptions: VaultFilterOptions = {
  status: "all",
  type: null,
  folderId: null,
  collectionId: null,
  organizationId: null,
};

export type VaultFilterOptions = Readonly<{
  status: CipherStatus;
  type?: CipherType;
  folderId?: string | typeof VaultFilter.Unassigned;
  collectionId?: string | typeof VaultFilter.Unassigned;
  organizationId?: string | typeof VaultFilter.Unassigned;
}>;

export type VaultFilterFunction = (cipher: CipherView) => boolean;

export class VaultFilter implements VaultFilterOptions {
  static readonly Unassigned: unique symbol = Symbol("Unassigned");

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

  get type() {
    return this.options.type;
  }

  get folderId() {
    return this.options.folderId;
  }

  get collectionId() {
    return this.options.collectionId;
  }

  get organizationId() {
    return this.options.organizationId;
  }

  get filterFunction(): VaultFilterFunction {
    return (cipher) => {
      const status =
        this.status === "all" ||
        (this.status === "favorites" && cipher.favorite) ||
        (this.status === "trash" && cipher.isDeleted);

      const type = this.type == null || (this.type != null && this.type === cipher.type);

      const folder =
        this.folderId == null ||
        (this.folderId === VaultFilter.Unassigned && cipher.folderId == null) ||
        (this.folderId != null && this.folderId === cipher.folderId);

      const collection =
        this.collectionId == null ||
        (this.collectionId === VaultFilter.Unassigned &&
          (cipher.collectionIds == null || cipher.collectionIds.length === 0)) ||
        (this.collectionId != null &&
          this.collectionId !== VaultFilter.Unassigned &&
          cipher.collectionIds != null &&
          cipher.collectionIds.includes(this.collectionId));

      const organization =
        this.organizationId == null ||
        (this.organizationId === VaultFilter.Unassigned && cipher.organizationId == null) ||
        (this.organizationId != null && this.organizationId === cipher.organizationId);

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

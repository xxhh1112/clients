import { EncryptService } from "@bitwarden/common/abstractions/encrypt.service";
import { Encryptable } from "@bitwarden/common/interfaces/crypto.interface";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetric-crypto-key";

import { ServiceAccount } from "../service-account";

export class ServiceAccountView implements Encryptable<ServiceAccount> {
  id: string;
  organizationId: string;
  name: string;
  creationDate: Date;
  revisionDate: Date;

  static async decrypt(
    encryptService: EncryptService,
    key: SymmetricCryptoKey,
    model: ServiceAccount
  ): Promise<ServiceAccountView> {
    const view = new ServiceAccountView();

    view.id = model.id;
    view.organizationId = model.organizationId;
    view.name = await encryptService.decryptToUtf8(model.name, key);
    view.creationDate = model.creationDate;
    view.revisionDate = model.revisionDate;

    return view;
  }

  keyIdentifier(): string {
    return this.organizationId;
  }

  async encrypt(encryptService: EncryptService, key: SymmetricCryptoKey): Promise<ServiceAccount> {
    const model = new ServiceAccount();

    model.id = this.id;
    model.organizationId = this.organizationId;
    model.name = await encryptService.encrypt(this.name, key);
    model.creationDate = this.creationDate;
    model.revisionDate = this.revisionDate;

    return model;
  }
}

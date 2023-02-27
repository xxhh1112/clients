import { EncryptService } from "@bitwarden/common/abstractions/encrypt.service";
import { Encryptable } from "@bitwarden/common/interfaces/crypto.interface";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetric-crypto-key";

import { AccessToken } from "../access-token";

export class AccessTokenView implements Encryptable<AccessToken> {
  id: string;
  name: string;
  scopes: string[];
  expireAt?: Date;
  creationDate: Date;
  revisionDate: Date;

  static async decrypt(
    encryptService: EncryptService,
    key: SymmetricCryptoKey,
    model: AccessToken
  ): Promise<AccessTokenView> {
    const view = new AccessTokenView();

    view.id = model.id;
    view.name = await encryptService.decryptToUtf8(model.name, key);
    view.scopes = model.scopes;
    view.expireAt = model.expireAt;
    view.creationDate = model.creationDate;
    view.revisionDate = model.revisionDate;

    return view;
  }

  async encrypt(encryptService: EncryptService, key: SymmetricCryptoKey): Promise<AccessToken> {
    const model = new AccessToken();

    model.id = this.id;
    model.name = await encryptService.encrypt(this.name, key);
    model.scopes = this.scopes;
    model.expireAt = this.expireAt;
    model.creationDate = this.creationDate;
    model.revisionDate = this.revisionDate;

    return model;
  }
}

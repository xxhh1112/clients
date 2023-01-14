import { Jsonify } from "type-fest";

import { EncryptService } from "../../abstractions/encrypt.service";
import { Password } from "../domain/password";
import { SymmetricCryptoKey } from "../domain/symmetric-crypto-key";

export class PasswordHistoryView {
  password: string = null;
  lastUsedDate: Date = null;

  async encrypt(encryptService: EncryptService, key: SymmetricCryptoKey): Promise<Password> {
    const password = new Password();

    password.lastUsedDate = this.lastUsedDate;
    password.password =
      this.password != null ? await encryptService.encrypt(this.password, key) : null;

    return password;
  }

  static fromJSON(obj: Partial<Jsonify<PasswordHistoryView>>): PasswordHistoryView {
    const lastUsedDate = obj.lastUsedDate == null ? null : new Date(obj.lastUsedDate);

    return Object.assign(new PasswordHistoryView(), obj, {
      lastUsedDate: lastUsedDate,
    });
  }

  static async decrypt(encryptService: EncryptService, key: SymmetricCryptoKey, model: Password) {
    const view = new PasswordHistoryView();

    view.lastUsedDate = model.lastUsedDate;
    view.password = await model.password?.decryptWithEncryptService(encryptService, key);

    return view;
  }
}

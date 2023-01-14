import { Jsonify } from "type-fest";

import { EncryptService } from "../../abstractions/encrypt.service";
import { SecureNoteType } from "../../enums/secureNoteType";
import { SecureNote } from "../domain/secure-note";
import { SymmetricCryptoKey } from "../domain/symmetric-crypto-key";

import { ItemView } from "./item.view";

export class SecureNoteView extends ItemView {
  type: SecureNoteType = null;

  constructor(n?: SecureNote) {
    super();
    if (!n) {
      return;
    }

    this.type = n.type;
  }

  get subTitle(): string {
    return null;
  }

  async encrypt(encryptService: EncryptService, key: SymmetricCryptoKey): Promise<SecureNote> {
    const note = new SecureNote();

    note.type = this.type;

    return note;
  }

  static fromJSON(obj: Partial<Jsonify<SecureNoteView>>): SecureNoteView {
    return Object.assign(new SecureNoteView(), obj);
  }

  static async decrypt(encryptService: EncryptService, key: SymmetricCryptoKey, model: SecureNote) {
    if (model == null) {
      return null;
    }

    const secureNote = new SecureNoteView();
    secureNote.type = model.type;
    return secureNote;
  }
}

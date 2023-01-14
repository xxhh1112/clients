import { Jsonify } from "type-fest";

import { EncryptService } from "../../abstractions/encrypt.service";
import { Attachment } from "../domain/attachment";
import { SymmetricCryptoKey } from "../domain/symmetric-crypto-key";

import { View } from "./view";

export class AttachmentView implements View {
  id: string = null;
  url: string = null;
  size: string = null;
  sizeName: string = null;
  fileName: string = null;
  key: SymmetricCryptoKey = null;

  get fileSize(): number {
    try {
      if (this.size != null) {
        return parseInt(this.size, null);
      }
    } catch {
      // Invalid file size.
    }
    return 0;
  }

  async encrypt(encryptService: EncryptService, key: SymmetricCryptoKey): Promise<Attachment> {
    const attachment = new Attachment();

    attachment.id = this.id;
    attachment.url = this.url;
    attachment.size = this.size;
    attachment.sizeName = this.sizeName;

    attachment.fileName =
      this.fileName != null ? await encryptService.encrypt(this.fileName, key) : null;
    attachment.key = this.key != null ? await encryptService.encrypt(this.key.key, key) : null;

    return attachment;
  }

  static fromJSON(obj: Partial<Jsonify<AttachmentView>>): AttachmentView {
    const key = obj.key == null ? null : SymmetricCryptoKey.fromJSON(obj.key);
    return Object.assign(new AttachmentView(), obj, { key: key });
  }

  static async decrypt(encryptService: EncryptService, key: SymmetricCryptoKey, model: Attachment) {
    const view = new AttachmentView();

    view.id = model.id;
    view.url = model.url;
    view.size = model.size;
    view.sizeName = model.sizeName;
    view.fileName = await model.fileName?.decryptWithEncryptService(encryptService, key);

    const attachmentKey = await (model.key ? encryptService.decryptToBytes(model.key, key) : null);
    view.key = new SymmetricCryptoKey(attachmentKey);

    return view;
  }
}

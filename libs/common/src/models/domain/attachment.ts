import { Jsonify } from "type-fest";

import { nullableFactory } from "../../interfaces/crypto.interface";
import { AttachmentData } from "../data/attachment.data";

import { EncString } from "./enc-string";

export class Attachment {
  id: string;
  url: string;
  size: string;
  sizeName: string; // Readable size, ex: "4.2 KB" or "1.43 GB"
  key: EncString;
  fileName: EncString;

  constructor(obj?: AttachmentData) {
    if (obj == null) {
      return;
    }

    this.id = obj.id;
    this.url = obj.url;
    this.size = obj.size;
    this.sizeName = obj.sizeName;
    this.key = nullableFactory(EncString, obj.key);
    this.fileName = nullableFactory(EncString, obj.fileName);
  }

  toAttachmentData(): AttachmentData {
    const data = new AttachmentData();

    data.id = this.id;
    data.url = this.url;
    data.size = this.size;
    data.sizeName = this.sizeName;
    data.key = this.key?.encryptedString;
    data.fileName = this.fileName?.encryptedString;

    return data;
  }

  static fromJSON(obj: Partial<Jsonify<Attachment>>): Attachment {
    if (obj == null) {
      return null;
    }

    return Object.assign(new Attachment(), obj, {
      key: nullableFactory(EncString, obj.key),
      fileName: nullableFactory(EncString, obj.fileName),
    });
  }
}

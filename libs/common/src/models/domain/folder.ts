import { Jsonify } from "type-fest";

import { FolderData } from "../data/folder.data";
import { DecryptableDomain } from "../view/encryptable";

import { EncString } from "./enc-string";

export class Folder implements DecryptableDomain {
  id: string;
  name: EncString;
  revisionDate: Date;

  constructor(obj?: FolderData) {
    if (obj == null) {
      return;
    }

    this.id = obj.id;
    this.name = new EncString(obj.name);
    this.revisionDate = obj.revisionDate != null ? new Date(obj.revisionDate) : null;
  }

  keyIdentifier(): string | null {
    return null;
  }

  static fromJSON(obj: Jsonify<Folder>) {
    const revisionDate = obj.revisionDate == null ? null : new Date(obj.revisionDate);
    return Object.assign(new Folder(), obj, { name: EncString.fromJSON(obj.name), revisionDate });
  }
}

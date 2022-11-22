import { Jsonify } from "type-fest";

import { DecryptableDomain, nullableFactory } from "../../interfaces/crypto.interface";
import { FolderData } from "../data/folder.data";

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
    this.name = nullableFactory(EncString, obj.name);
    this.revisionDate = nullableFactory(Date, obj.revisionDate);
  }

  keyIdentifier(): string | null {
    return null;
  }

  static fromJSON(obj: Jsonify<Folder>) {
    const revisionDate = nullableFactory(Date, obj.revisionDate);
    return Object.assign(new Folder(), obj, { name: EncString.fromJSON(obj.name), revisionDate });
  }
}

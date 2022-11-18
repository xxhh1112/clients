import { Jsonify } from "type-fest";

import { FolderData } from "../data/folder.data";
import { DecryptableDomain, nullableFactory } from "../view/encryptable";

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

  get keyIdentifier(): string | undefined {
    return undefined;
  }

  static fromJSON(obj: Jsonify<Folder>) {
    const revisionDate = nullableFactory(Date, obj.revisionDate);
    return Object.assign(new Folder(), obj, { name: EncString.fromJSON(obj.name), revisionDate });
  }
}

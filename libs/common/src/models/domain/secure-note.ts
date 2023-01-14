import { Jsonify } from "type-fest";

import { SecureNoteType } from "../../enums/secureNoteType";
import { SecureNoteData } from "../data/secure-note.data";

export class SecureNote {
  type: SecureNoteType;

  constructor(obj?: SecureNoteData) {
    if (obj == null) {
      return;
    }

    this.type = obj.type;
  }

  toSecureNoteData(): SecureNoteData {
    const n = new SecureNoteData();
    n.type = this.type;
    return n;
  }

  static fromJSON(obj: Jsonify<SecureNote>): SecureNote {
    if (obj == null) {
      return null;
    }

    return Object.assign(new SecureNote(), obj);
  }
}

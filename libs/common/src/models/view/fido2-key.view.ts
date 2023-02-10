import { Jsonify } from "type-fest";

import { ItemView } from "../../vault/models/view/item.view";

export class Fido2KeyView extends ItemView {
  keyType: "ECDSA";
  keyCurve: "P-256";
  keyValue: string;
  rpId: string;
  rpName: string;
  userHandle: string;
  userName: string;
  origin: string;

  get subTitle(): string {
    return this.userName;
  }

  static fromJSON(obj: Partial<Jsonify<Fido2KeyView>>): Fido2KeyView {
    return Object.assign(new Fido2KeyView(), obj);
  }
}

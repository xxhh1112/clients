import { Jsonify } from "type-fest";

import { ItemView } from "./item.view";

export class Fido2KeyView extends ItemView {
  nonDiscoverableId: string;
  keyType: "public-key";
  keyAlgorithm: "ECDSA";
  keyCurve: "P-256";
  keyValue: string;
  rpId: string;
  userHandle: string;
  counter: number;

  // Extras
  rpName: string;
  userName: string;

  get subTitle(): string {
    return this.userName;
  }

  get canLaunch(): boolean {
    return this.rpId != null;
  }

  get launchUri(): string {
    return this.canLaunch ? `https://${this.rpId}` : null;
  }

  static fromJSON(obj: Partial<Jsonify<Fido2KeyView>>): Fido2KeyView {
    return Object.assign(new Fido2KeyView(), obj);
  }
}

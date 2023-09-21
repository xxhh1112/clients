import { Jsonify } from "type-fest";

import { ItemView } from "./item.view";

export class Fido2KeyView extends ItemView {
  credentialId: string;
  keyType: "public-key";
  keyAlgorithm: "ECDSA";
  keyCurve: "P-256";
  keyValue: string;
  rpId: string;
  userHandle: string;
  counter: number;
  rpName: string;
  userDisplayName: string;
  discoverable: boolean;
  creationDate: Date = null;

  get subTitle(): string {
    return this.userDisplayName;
  }

  get canLaunch(): boolean {
    return this.rpId != null;
  }

  get launchUri(): string {
    return this.canLaunch ? `https://${this.rpId}` : null;
  }

  static fromJSON(obj: Partial<Jsonify<Fido2KeyView>>): Fido2KeyView {
    const creationDate = obj.creationDate != null ? new Date(obj.creationDate) : null;
    return Object.assign(new Fido2KeyView(), obj, {
      creationDate,
    });
  }
}

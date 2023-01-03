import { Jsonify } from "type-fest";

import { Fido2KeyData } from "../data/fido2-key.data";
import { Fido2KeyView } from "../view/fido2-key.view";

import Domain from "./domain-base";
import { EncString } from "./enc-string";
import { SymmetricCryptoKey } from "./symmetric-crypto-key";

export class Fido2Key extends Domain {
  key: EncString; // PCKS#8
  rpId: EncString;
  origin: EncString;
  userHandle: EncString;
  // extensions: Record<string, unknown>;

  constructor(obj?: Fido2KeyData) {
    super();
    if (obj == null) {
      return;
    }

    this.buildDomainModel(
      this,
      obj,
      {
        key: null,
        rpId: null,
        origin: null,
        userHandle: null,
      },
      []
    );
  }

  decrypt(orgId: string, encKey?: SymmetricCryptoKey): Promise<Fido2KeyView> {
    return this.decryptObj(
      new Fido2KeyView(),
      {
        key: null,
        rpId: null,
        origin: null,
        userHandle: null,
      },
      orgId,
      encKey
    );
  }

  toFido2KeyData(): Fido2KeyData {
    const i = new Fido2KeyData();
    this.buildDataModel(this, i, {
      key: null,
      rpId: null,
      origin: null,
      userHandle: null,
    });
    return i;
  }

  static fromJSON(obj: Jsonify<Fido2Key>): Fido2Key {
    if (obj == null) {
      return null;
    }

    const key = EncString.fromJSON(obj.key);
    const rpId = EncString.fromJSON(obj.rpId);
    const origin = EncString.fromJSON(obj.origin);
    const userHandle = EncString.fromJSON(obj.userHandle);

    return Object.assign(new Fido2Key(), obj, {
      key,
      rpId,
      origin,
      userHandle,
    });
  }
}

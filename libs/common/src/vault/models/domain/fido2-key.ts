import { Jsonify } from "type-fest";

import Domain from "../../../platform/models/domain/domain-base";
import { EncString } from "../../../platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { Fido2KeyData } from "../data/fido2-key.data";
import { Fido2KeyView } from "../view/fido2-key.view";

export class Fido2Key extends Domain {
  nonDiscoverableId: EncString | null = null;
  keyType: EncString;
  keyAlgorithm: EncString;
  keyCurve: EncString;
  keyValue: EncString;
  rpId: EncString;
  userHandle: EncString;
  counter: EncString;

  // Extras
  rpName: EncString;
  userName: EncString;
  origin: EncString;

  constructor(obj?: Fido2KeyData) {
    super();
    if (obj == null) {
      return;
    }

    this.buildDomainModel(
      this,
      obj,
      {
        nonDiscoverableId: null,
        keyType: null,
        keyAlgorithm: null,
        keyCurve: null,
        keyValue: null,
        rpId: null,
        userHandle: null,
        counter: null,
        rpName: null,
        userName: null,
        origin: null,
      },
      []
    );
  }

  async decrypt(orgId: string, encKey?: SymmetricCryptoKey): Promise<Fido2KeyView> {
    const view = await this.decryptObj(
      new Fido2KeyView(),
      {
        nonDiscoverableId: null,
        keyType: null,
        keyAlgorithm: null,
        keyCurve: null,
        keyValue: null,
        rpId: null,
        userHandle: null,
        rpName: null,
        userName: null,
        origin: null,
      },
      orgId,
      encKey
    );

    const { counter } = await this.decryptObj(
      { counter: "" },
      {
        counter: null,
      },
      orgId,
      encKey
    );
    // Counter will end up as NaN if this fails
    view.counter = parseInt(counter);

    return view;
  }

  toFido2KeyData(): Fido2KeyData {
    const i = new Fido2KeyData();
    this.buildDataModel(this, i, {
      nonDiscoverableId: null,
      keyType: null,
      keyAlgorithm: null,
      keyCurve: null,
      keyValue: null,
      rpId: null,
      userHandle: null,
      counter: null,
      rpName: null,
      userName: null,
      origin: null,
    });
    return i;
  }

  static fromJSON(obj: Jsonify<Fido2Key>): Fido2Key {
    if (obj == null) {
      return null;
    }

    const nonDiscoverableId = EncString.fromJSON(obj.nonDiscoverableId);
    const keyType = EncString.fromJSON(obj.keyType);
    const keyAlgorithm = EncString.fromJSON(obj.keyAlgorithm);
    const keyCurve = EncString.fromJSON(obj.keyCurve);
    const keyValue = EncString.fromJSON(obj.keyValue);
    const rpId = EncString.fromJSON(obj.rpId);
    const userHandle = EncString.fromJSON(obj.userHandle);
    const counter = EncString.fromJSON(obj.counter);
    const rpName = EncString.fromJSON(obj.rpName);
    const userName = EncString.fromJSON(obj.userName);
    const origin = EncString.fromJSON(obj.origin);

    return Object.assign(new Fido2Key(), obj, {
      nonDiscoverableId,
      keyType,
      keyAlgorithm,
      keyCurve,
      keyValue,
      rpId,
      userHandle,
      counter,
      rpName,
      userName,
      origin,
    });
  }
}

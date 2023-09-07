import { Jsonify } from "type-fest";

import Domain from "../../../platform/models/domain/domain-base";
import { EncString } from "../../../platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { Fido2KeyData } from "../data/fido2-key.data";
import { Fido2KeyView } from "../view/fido2-key.view";

export class Fido2Key extends Domain {
  credentialId: EncString | null = null;
  keyType: EncString;
  keyAlgorithm: EncString;
  keyCurve: EncString;
  keyValue: EncString;
  rpId: EncString;
  userHandle: EncString;
  counter: EncString;
  rpName: EncString;
  userDisplayName: EncString;
  discoverable: EncString;

  constructor(obj?: Fido2KeyData) {
    super();
    if (obj == null) {
      return;
    }

    this.buildDomainModel(
      this,
      obj,
      {
        credentialId: null,
        keyType: null,
        keyAlgorithm: null,
        keyCurve: null,
        keyValue: null,
        rpId: null,
        userHandle: null,
        counter: null,
        rpName: null,
        userDisplayName: null,
        discoverable: null,
      },
      []
    );
  }

  async decrypt(orgId: string, encKey?: SymmetricCryptoKey): Promise<Fido2KeyView> {
    const view = await this.decryptObj(
      new Fido2KeyView(),
      {
        credentialId: null,
        keyType: null,
        keyAlgorithm: null,
        keyCurve: null,
        keyValue: null,
        rpId: null,
        userHandle: null,
        rpName: null,
        userDisplayName: null,
        discoverable: null,
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

    const { discoverable } = await this.decryptObj(
      { discoverable: "" },
      {
        discoverable: null,
      },
      orgId,
      encKey
    );
    view.discoverable = discoverable === "true";

    return view;
  }

  toFido2KeyData(): Fido2KeyData {
    const i = new Fido2KeyData();
    this.buildDataModel(this, i, {
      credentialId: null,
      keyType: null,
      keyAlgorithm: null,
      keyCurve: null,
      keyValue: null,
      rpId: null,
      userHandle: null,
      counter: null,
      rpName: null,
      userDisplayName: null,
      discoverable: null,
    });
    return i;
  }

  static fromJSON(obj: Jsonify<Fido2Key>): Fido2Key {
    if (obj == null) {
      return null;
    }

    const credentialId = EncString.fromJSON(obj.credentialId);
    const keyType = EncString.fromJSON(obj.keyType);
    const keyAlgorithm = EncString.fromJSON(obj.keyAlgorithm);
    const keyCurve = EncString.fromJSON(obj.keyCurve);
    const keyValue = EncString.fromJSON(obj.keyValue);
    const rpId = EncString.fromJSON(obj.rpId);
    const userHandle = EncString.fromJSON(obj.userHandle);
    const counter = EncString.fromJSON(obj.counter);
    const rpName = EncString.fromJSON(obj.rpName);
    const userDisplayName = EncString.fromJSON(obj.userDisplayName);
    const discoverable = EncString.fromJSON(obj.discoverable);

    return Object.assign(new Fido2Key(), obj, {
      credentialId,
      keyType,
      keyAlgorithm,
      keyCurve,
      keyValue,
      rpId,
      userHandle,
      counter,
      rpName,
      userDisplayName,
      discoverable,
    });
  }
}

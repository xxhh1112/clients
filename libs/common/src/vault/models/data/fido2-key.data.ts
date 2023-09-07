import { Fido2KeyApi } from "../../api/fido2-key.api";

export class Fido2KeyData {
  credentialId: string;
  keyType: "public-key";
  keyAlgorithm: "ECDSA";
  keyCurve: "P-256";
  keyValue: string;
  rpId: string;
  userHandle: string;
  counter: string;
  rpName: string;
  userDisplayName: string;

  constructor(data?: Fido2KeyApi) {
    if (data == null) {
      return;
    }

    this.credentialId = data.credentialId;
    this.keyType = data.keyType;
    this.keyAlgorithm = data.keyAlgorithm;
    this.keyCurve = data.keyCurve;
    this.keyValue = data.keyValue;
    this.rpId = data.rpId;
    this.userHandle = data.userHandle;
    this.counter = data.counter;
    this.rpName = data.rpName;
    this.userDisplayName = data.userDisplayName;
  }
}

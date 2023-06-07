import { Fido2KeyApi } from "../../api/fido2-key.api";

export class Fido2KeyData {
  nonDiscoverableId: string;
  keyType: "public-key";
  keyAlgorithm: "ECDSA";
  keyCurve: "P-256";
  keyValue: string;
  rpId: string;
  userHandle: string;
  counter: string;

  // Extras
  rpName: string;
  userName: string;

  constructor(data?: Fido2KeyApi) {
    if (data == null) {
      return;
    }

    this.nonDiscoverableId = data.nonDiscoverableId;
    this.keyType = data.keyType;
    this.keyAlgorithm = data.keyAlgorithm;
    this.keyCurve = data.keyCurve;
    this.keyValue = data.keyValue;
    this.rpId = data.rpId;
    this.userHandle = data.userHandle;
    this.counter = data.counter;
    this.rpName = data.rpName;
    this.userName = data.userName;
  }
}

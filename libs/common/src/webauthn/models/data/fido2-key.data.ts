import { Fido2KeyApi } from "../api/fido2-key.api";

export class Fido2KeyData {
  keyType: "ECDSA";
  keyCurve: "P-256";
  keyValue: string;
  rpId: string;
  rpName: string;
  userHandle: string;
  userName: string;
  origin: string;

  constructor(data?: Fido2KeyApi) {
    if (data == null) {
      return;
    }

    this.keyType = data.keyType;
    this.keyCurve = data.keyCurve;
    this.keyValue = data.keyValue;
    this.rpId = data.rpId;
    this.rpName = data.rpName;
    this.userHandle = data.userHandle;
    this.userName = data.userName;
    this.origin = data.origin;
  }
}

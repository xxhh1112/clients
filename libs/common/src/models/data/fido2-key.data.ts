import { Fido2KeyApi } from "../api/fido2-key.api";

export class Fido2KeyData {
  key: string;
  rpId: string;
  origin: string;
  userHandle: string;

  constructor(data?: Fido2KeyApi) {
    if (data == null) {
      return;
    }

    this.key = data.key;
    this.rpId = data.rpId;
    this.origin = data.origin;
    this.userHandle = data.userHandle;
  }
}

import { BaseResponse } from "../../models/response/base.response";

export class Fido2KeyApi extends BaseResponse {
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

  constructor(data: any = null) {
    super(data);
    if (data == null) {
      return;
    }

    this.nonDiscoverableId = this.getResponseProperty("NonDiscoverableId");
    this.keyType = this.getResponseProperty("KeyType");
    this.keyAlgorithm = this.getResponseProperty("KeyAlgorithm");
    this.keyCurve = this.getResponseProperty("KeyCurve");
    this.keyValue = this.getResponseProperty("keyValue");
    this.rpId = this.getResponseProperty("RpId");
    this.userHandle = this.getResponseProperty("UserHandle");
    this.counter = this.getResponseProperty("Counter");
    this.rpName = this.getResponseProperty("RpName");
    this.userName = this.getResponseProperty("UserName");
  }
}

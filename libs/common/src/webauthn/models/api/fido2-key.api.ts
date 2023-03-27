import { BaseResponse } from "../../../models/response/base.response";

export class Fido2KeyApi extends BaseResponse {
  keyType: "public-key";
  keyAlgorithm: "ECDSA";
  keyCurve: "P-256";
  keyValue: string;
  rpId: string;
  userHandle: string;

  // Extras
  rpName: string;
  userName: string;
  origin: string;

  constructor(data: any = null) {
    super(data);
    if (data == null) {
      return;
    }

    this.keyType = this.getResponseProperty("KeyType");
    this.keyAlgorithm = this.getResponseProperty("KeyType");
    this.keyCurve = this.getResponseProperty("KeyCurve");
    this.keyValue = this.getResponseProperty("keyValue");
    this.rpId = this.getResponseProperty("RpId");
    this.rpName = this.getResponseProperty("RpName");
    this.userName = this.getResponseProperty("UserName");
    this.userHandle = this.getResponseProperty("UserHandle");
    this.origin = this.getResponseProperty("Origin");
  }
}

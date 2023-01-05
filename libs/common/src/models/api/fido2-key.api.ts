import { BaseResponse } from "../response/base.response";

export class Fido2KeyApi extends BaseResponse {
  keyType: "ECDSA";
  keyCurve: "P-256";
  keyValue: string;
  rpId: string;
  rpName: string;
  userHandle: string;
  userName: string;
  origin: string;

  constructor(data: any = null) {
    super(data);
    if (data == null) {
      return;
    }

    this.keyType = this.getResponseProperty("KeyType");
    this.keyCurve = this.getResponseProperty("KeyCurve");
    this.keyValue = this.getResponseProperty("keyValue");
    this.rpId = this.getResponseProperty("RpId");
    this.userHandle = this.getResponseProperty("UserHandle");
    this.userName = this.getResponseProperty("UserName");
    this.origin = this.getResponseProperty("Origin");
  }
}

import { BaseResponse } from "../response/base.response";

export class Fido2KeyApi extends BaseResponse {
  key: string;
  rpId: string;
  origin: string;
  userHandle: string;

  constructor(data: any = null) {
    super(data);
    if (data == null) {
      return;
    }

    this.key = this.getResponseProperty("Key");
    this.rpId = this.getResponseProperty("RpId");
    this.origin = this.getResponseProperty("Origin");
    this.userHandle = this.getResponseProperty("UserHandle");
  }
}

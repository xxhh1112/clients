import { BaseResponse } from "../../../../models/response/base.response";

export class WebauthnCredentialResponse extends BaseResponse {
  id: string;
  name: string;
  prfStatus: number;

  constructor(response: unknown) {
    super(response);
    this.id = this.getResponseProperty("id");
    this.name = this.getResponseProperty("name");
    this.prfStatus = this.getResponseProperty("prfSupport");
  }
}

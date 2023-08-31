import { BaseResponse } from "../../../../models/response/base.response";

export class WebauthnAssertionResponse extends BaseResponse {
  token: string;

  constructor(response: unknown) {
    super(response);
    this.token = this.getResponseProperty("token");
  }
}

import { BaseResponse } from "@bitwarden/common/models/response/base.response";

import { AssertionResponse } from "./assertion.response";

export class CredentialAssertionOptionsResponse extends BaseResponse {
  options: AssertionResponse;
  token: string;

  constructor(response: unknown) {
    super(response);
    this.options = new AssertionResponse(this.getResponseProperty("options"));
    this.token = this.getResponseProperty("token");
  }
}

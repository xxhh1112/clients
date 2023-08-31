import { BaseResponse } from "../../../../models/response/base.response";
import { ChallengeResponse } from "../../../models/response/two-factor-web-authn.response";

export class CredentialCreateOptionsResponse extends BaseResponse {
  options: ChallengeResponse;
  token: string;

  constructor(response: unknown) {
    super(response);
    this.options = new ChallengeResponse(this.getResponseProperty("options"));
    this.token = this.getResponseProperty("token");
  }
}

import { ChallengeResponse } from "@bitwarden/common/auth/models/response/two-factor-web-authn.response";
import { BaseResponse } from "@bitwarden/common/models/response/base.response";

export class CredentialCreateOptionsResponse extends BaseResponse {
  options: ChallengeResponse;
  token: string;

  constructor(response: unknown) {
    super(response);
    this.options = new ChallengeResponse(this.getResponseProperty("options"));
    this.token = this.getResponseProperty("token");
  }
}

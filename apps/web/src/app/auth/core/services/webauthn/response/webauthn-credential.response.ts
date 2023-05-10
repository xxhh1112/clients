import { BaseResponse } from "@bitwarden/common/models/response/base.response";

export class WebauthnCredentialResponse extends BaseResponse {
  id: string;
  name: string;
  prf: "active" | "inactive" | "unsupported";

  constructor(response: unknown) {
    super(response);
    this.id = this.getResponseProperty("id");
    this.name = this.getResponseProperty("name");
    this.prf = this.getResponseProperty("prf");
  }
}

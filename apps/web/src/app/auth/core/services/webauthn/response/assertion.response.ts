import { Utils } from "@bitwarden/common/misc/utils";
import { BaseResponse } from "@bitwarden/common/models/response/base.response";

export class AssertionResponse extends BaseResponse implements PublicKeyCredentialRequestOptions {
  allowCredentials?: PublicKeyCredentialDescriptor[];
  challenge: BufferSource;
  extensions?: AuthenticationExtensionsClientInputs;
  rpId?: string;
  timeout?: number;
  userVerification?: UserVerificationRequirement;

  constructor(response: unknown) {
    super(response);
    this.allowCredentials = this.getResponseProperty("allowCredentials").map((c: any) => ({
      ...c,
      id: Utils.fromUrlB64ToArray(c.id).buffer,
    }));
    this.challenge = Utils.fromUrlB64ToArray(this.getResponseProperty("challenge"));
    this.extensions = this.getResponseProperty("extensions");
    this.rpId = this.getResponseProperty("rpId");
    this.timeout = this.getResponseProperty("timeout");
    this.userVerification = this.getResponseProperty("userVerification");
  }
}

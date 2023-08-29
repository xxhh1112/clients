import { BaseResponse } from "@bitwarden/common/models/response/base.response";
import { Utils } from "@bitwarden/common/platform/misc/utils";

export class AssertionOptionsResponse
  extends BaseResponse
  implements PublicKeyCredentialRequestOptions
{
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

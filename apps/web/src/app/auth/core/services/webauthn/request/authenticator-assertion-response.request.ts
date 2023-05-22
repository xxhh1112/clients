import { Utils } from "@bitwarden/common/misc/utils";

import { WebauthnResponseRequest } from "./webauthn-response.request";

export class AuthenticatorAssertionResponseRequest extends WebauthnResponseRequest {
  response: {
    authenticatorData: string;
    signature: string;
    clientDataJson: string;
    userHandle: string;
  };

  constructor(credential: PublicKeyCredential) {
    super(credential);

    if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
      throw new Error("Invalid authenticator response");
    }

    this.response = {
      authenticatorData: Utils.fromBufferToB64(credential.response.authenticatorData),
      signature: Utils.fromBufferToB64(credential.response.signature),
      clientDataJson: Utils.fromBufferToB64(credential.response.clientDataJSON),
      userHandle: Utils.fromBufferToB64(credential.response.userHandle),
    };
  }
}

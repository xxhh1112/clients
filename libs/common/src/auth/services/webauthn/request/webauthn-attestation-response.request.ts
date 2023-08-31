import { Utils } from "../../../../platform/misc/utils";

import { WebauthnResponseRequest } from "./webauthn-response.request";

export class WebauthnAttestationResponseRequest extends WebauthnResponseRequest {
  response: {
    attestationObject: string;
    clientDataJson: string;
  };

  constructor(credential: PublicKeyCredential) {
    super(credential);

    if (!(credential.response instanceof AuthenticatorAttestationResponse)) {
      throw new Error("Invalid authenticator response");
    }

    this.response = {
      attestationObject: Utils.fromBufferToB64(credential.response.attestationObject),
      clientDataJson: Utils.fromBufferToB64(credential.response.clientDataJSON),
    };
  }
}

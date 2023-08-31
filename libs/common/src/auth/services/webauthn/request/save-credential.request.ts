import { WebauthnResponseRequest } from "./webauthn-response.request";

export class SaveCredentialRequest {
  deviceResponse: WebauthnResponseRequest;
  name: string;
  token: string;
  supportsPrf: boolean;
  userKey?: string;
  prfPublicKey?: string;
  prfPrivateKey?: string;
}

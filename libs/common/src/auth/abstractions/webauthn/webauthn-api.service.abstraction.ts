import { ListResponse } from "../../../models/response/list.response";
import { Verification } from "../../../types/verification";
import { SaveCredentialRequest } from "../../services/webauthn/request/save-credential.request";
import { WebauthnAssertionResponseRequest } from "../../services/webauthn/request/webauthn-assertion-response.request";
import { CredentialAssertionOptionsResponse } from "../../services/webauthn/response/credential-assertion-options.response";
import { CredentialCreateOptionsResponse } from "../../services/webauthn/response/credential-create-options.response";
import { WebauthnCredentialResponse } from "../../services/webauthn/response/webauthn-credential.response";

export class WebauthnApiServiceAbstraction {
  getCredentialCreateOptions: (
    verification: Verification
  ) => Promise<CredentialCreateOptionsResponse>;
  saveCredential: (request: SaveCredentialRequest) => Promise<boolean>;
  getCredentials: () => Promise<ListResponse<WebauthnCredentialResponse>>;
  deleteCredential: (credentialId: string, verification: Verification) => Promise<void>;
  getCredentialAssertionOptions: (email?: string) => Promise<CredentialAssertionOptionsResponse>;
  assertCredential: (request: WebauthnAssertionResponseRequest) => Promise<string>;
}

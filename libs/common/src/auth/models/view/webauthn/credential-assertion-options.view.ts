import { AssertionOptionsResponse } from "../../../services/webauthn/response/assertion-options.response";

export class CredentialAssertionOptionsView {
  constructor(readonly options: AssertionOptionsResponse, readonly token: string) {}
}

import { AssertionResponse } from "../services/webauthn/response/assertion.response";

export class CredentialAssertionOptionsView {
  constructor(readonly options: AssertionResponse, readonly token: string) {}
}

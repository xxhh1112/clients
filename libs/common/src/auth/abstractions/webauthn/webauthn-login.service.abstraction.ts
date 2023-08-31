import { Observable } from "rxjs";

import { AuthResult } from "../../models/domain/auth-result";
import { CredentialAssertionOptionsView } from "../../models/view/webauthn/credential-assertion-options.view";
import { WebauthnAssertionView } from "../../models/view/webauthn/webauthn-assertion.view";

export abstract class WebauthnLoginServiceAbstraction {
  readonly enabled$: Observable<boolean>;

  getCredentialAssertionOptions: (
    email?: string
  ) => Promise<CredentialAssertionOptionsView | undefined>;
  assertCredential: (
    credentialOptions: CredentialAssertionOptionsView
  ) => Promise<WebauthnAssertionView | undefined>;
  logIn: (assertion: WebauthnAssertionView) => Promise<AuthResult>;
}

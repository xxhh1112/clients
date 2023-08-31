import { Observable } from "rxjs";

import { Verification } from "../../../types/verification";
import { CredentialCreateOptionsView } from "../../models/view/webauthn/credential-create-options.view";
import { PendingWebauthnCredentialView } from "../../models/view/webauthn/pending-webauthn-credential.view";
import { PendingWebauthnCryptoKeysView } from "../../models/view/webauthn/pending-webauthn-crypto-keys.view";
import { WebauthnCredentialView } from "../../models/view/webauthn/webauthn-credential.view";

export abstract class WebauthnAdminServiceAbstraction {
  readonly enabled$: Observable<boolean>;
  readonly credentials$: Observable<WebauthnCredentialView[]>;
  readonly loading$: Observable<boolean>;

  getCredentialCreateOptions: (
    verification: Verification
  ) => Promise<CredentialCreateOptionsView | undefined>;
  createCredential: (
    credentialOptions: CredentialCreateOptionsView
  ) => Promise<PendingWebauthnCredentialView | undefined>;
  createCryptoKeys: (
    pendingCredential: PendingWebauthnCredentialView
  ) => Promise<PendingWebauthnCryptoKeysView | undefined>;
  saveCredential: (
    name: string,
    credential: PendingWebauthnCredentialView,
    cryptoKeys?: PendingWebauthnCryptoKeysView
  ) => Promise<void>;
  getCredential$: (credentialId: string) => Observable<WebauthnCredentialView>;
  deleteCredential: (credentialId: string, verification: Verification) => Promise<void>;
}

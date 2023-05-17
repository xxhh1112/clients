import { CredentialCreateOptionsView } from "./credential-create-options.view";

export class PendingWebauthnCredentialView {
  constructor(
    readonly createOptions: CredentialCreateOptionsView,
    readonly deviceResponse: PublicKeyCredential,
    readonly supportsPrf: boolean
  ) {}
}

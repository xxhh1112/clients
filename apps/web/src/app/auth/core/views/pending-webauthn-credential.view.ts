export class PendingWebauthnCredentialView {
  constructor(
    readonly token: string,
    readonly deviceResponse: PublicKeyCredential,
    readonly supportsPrf: boolean
  ) {}
}

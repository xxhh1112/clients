export enum WebauthnCredentialPrfStatus {
  Enabled = 0,
  Supported = 1,
  Unsupported = 2,
}

export class WebauthnCredentialView {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly prfStatus: WebauthnCredentialPrfStatus
  ) {}
}

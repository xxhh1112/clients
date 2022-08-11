import { AuthRequestType } from "@bitwarden/common/enums/authRequestType";

export class PasswordlessCreateAuthRequest {
  constructor(
    readonly email: string,
    readonly requestDeviceIdentifier: string,
    readonly publicKey: string,
    readonly type: AuthRequestType,
    readonly accessCode: string,
    readonly fingerprintPhrase: string
  ) {}
}

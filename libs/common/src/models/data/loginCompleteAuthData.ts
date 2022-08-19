import { TwoFactorProviderType } from "@bitwarden/common/enums/twoFactorProviderType";

import { LoginAuthData } from "./loginAuthData";
export class LoginCompleteAuthData extends LoginAuthData {
  remember?: boolean;
  constructor(
    readonly email: string,
    readonly accessCode: string,
    readonly authRequestId: string,
    readonly masterKey: ArrayBuffer,
    readonly masterPasswordHash: ArrayBuffer,
    readonly twoFactorProvider: TwoFactorProviderType,
    readonly twoFactorToken: string
  ) {
    super(email, accessCode, authRequestId, masterKey, masterPasswordHash);
  }
}

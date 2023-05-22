import { Utils } from "@bitwarden/common/misc/utils";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetric-crypto-key";

const LoginWithPrfSalt = "passwordless-login";

export async function getLoginWithPrfSalt(): Promise<ArrayBuffer> {
  return await crypto.subtle.digest("sha-256", Utils.fromUtf8ToArray(LoginWithPrfSalt));
}

export function createSymmetricKeyFromPrf(prf: ArrayBuffer) {
  return new SymmetricCryptoKey(prf);
}

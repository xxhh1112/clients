import { PasswordTokenRequest } from "../models/request/identity-token/password-token.request";
import { SsoTokenRequest } from "../models/request/identity-token/sso-token.request";
import { UserApiTokenRequest } from "../models/request/identity-token/user-api-token.request";
import { IdentityCaptchaResponse } from "../models/response/identity-captcha.response";
import { IdentityTokenResponse } from "../models/response/identity-token.response";
import { IdentityTwoFactorResponse } from "../models/response/identity-two-factor.response";

/**
 * Service for interacting with the Bitwarden Identity API for token management.
 */
export abstract class TokenApiService {
  getActiveBearerToken: () => Promise<string>;
  postIdentityToken: (
    request: PasswordTokenRequest | SsoTokenRequest | UserApiTokenRequest
  ) => Promise<IdentityTokenResponse | IdentityTwoFactorResponse | IdentityCaptchaResponse>;
  refreshIdentityToken: () => Promise<any>;
}

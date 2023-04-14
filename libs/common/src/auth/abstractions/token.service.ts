import { IdentityTokenResponse } from "../models/response/identity-token.response";

export abstract class TokenService {
  setTokens: (
    accessToken: string,
    refreshToken: string,
    clientIdClientSecret: [string, string]
  ) => Promise<any>;
  setAccessToken: (token: string) => Promise<any>;
  getAccessToken: () => Promise<string>;
  setRefreshToken: (refreshToken: string) => Promise<any>;
  getRefreshToken: () => Promise<string>;
  setClientId: (clientId: string) => Promise<any>;
  getClientId: () => Promise<string>;
  setClientSecret: (clientSecret: string) => Promise<any>;
  getClientSecret: () => Promise<string>;
  setTwoFactorToken: (tokenResponse: IdentityTokenResponse) => Promise<any>;
  getTwoFactorToken: () => Promise<string>;
  clearTwoFactorToken: () => Promise<any>;
  clearTokens: (userId?: string) => Promise<any>;
  decodeAccessToken: (token?: string) => any;
  getAccessTokenExpirationDate: () => Promise<Date>;
  accessTokenSecondsRemaining: (offsetSeconds?: number) => Promise<number>;
  accessTokenNeedsRefresh: (minutes?: number) => Promise<boolean>;
  getUserIdFromAccessToken: () => Promise<string>;
  getEmailFromAccessToken: () => Promise<string>;
  getEmailVerifiedFromAccessToken: () => Promise<boolean>;
  getNameFromAccessToken: () => Promise<string>;
  getIssuerFromAccessToken: () => Promise<string>;
  getIsExternalFromAccessToken: () => Promise<boolean>;
}

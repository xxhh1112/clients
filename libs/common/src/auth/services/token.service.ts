import { StateService } from "../../abstractions/state.service";
import { Utils } from "../../misc/utils";
import { TokenService as TokenServiceAbstraction } from "../abstractions/token.service";
import { IdentityTokenResponse } from "../models/response/identity-token.response";

export class TokenService implements TokenServiceAbstraction {
  static decodeJwtToken(token: string): Promise<any> {
    if (token == null) {
      throw new Error("Token not provided.");
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("JWT must have 3 parts");
    }

    const decoded = Utils.fromUrlB64ToUtf8(parts[1]);
    if (decoded == null) {
      throw new Error("Cannot decode the token");
    }

    const decodedToken = JSON.parse(decoded);
    return decodedToken;
  }

  constructor(private stateService: StateService) {}

  async setTokens(
    accessToken: string,
    refreshToken: string,
    clientIdClientSecret: [string, string]
  ): Promise<any> {
    await this.setAccessToken(accessToken);
    await this.setRefreshToken(refreshToken);
    if (clientIdClientSecret != null) {
      await this.setClientId(clientIdClientSecret[0]);
      await this.setClientSecret(clientIdClientSecret[1]);
    }
  }

  async setClientId(clientId: string): Promise<any> {
    return await this.stateService.setApiKeyClientId(clientId);
  }

  async getClientId(): Promise<string> {
    return await this.stateService.getApiKeyClientId();
  }

  async setClientSecret(clientSecret: string): Promise<any> {
    return await this.stateService.setApiKeyClientSecret(clientSecret);
  }

  async getClientSecret(): Promise<string> {
    return await this.stateService.getApiKeyClientSecret();
  }

  async setAccessToken(token: string): Promise<void> {
    await this.stateService.setAccessToken(token);
  }

  async getAccessToken(): Promise<string> {
    return await this.stateService.getAccessToken();
  }

  async setRefreshToken(refreshToken: string): Promise<any> {
    return await this.stateService.setRefreshToken(refreshToken);
  }

  async getRefreshToken(): Promise<string> {
    return await this.stateService.getRefreshToken();
  }

  async setTwoFactorToken(idTokenResponse: IdentityTokenResponse): Promise<any> {
    return await this.stateService.setTwoFactorToken(idTokenResponse.twoFactorToken);
  }

  async getTwoFactorToken(): Promise<string> {
    return await this.stateService.getTwoFactorToken();
  }

  async clearTwoFactorToken(): Promise<any> {
    return await this.stateService.setTwoFactorToken(null);
  }

  async clearTokens(userId?: string): Promise<any> {
    await this.stateService.setAccessToken(null, { userId: userId });
    await this.stateService.setRefreshToken(null, { userId: userId });
    await this.stateService.setApiKeyClientId(null, { userId: userId });
    await this.stateService.setApiKeyClientSecret(null, { userId: userId });
  }

  // jwthelper methods
  // ref https://github.com/auth0/angular-jwt/blob/master/src/angularJwt/services/jwt.js

  async decodeAccessToken(token?: string): Promise<any> {
    token = token ?? (await this.stateService.getAccessToken());

    if (token == null) {
      throw new Error("Token not found.");
    }

    return TokenService.decodeJwtToken(token);
  }

  async getAccessTokenExpirationDate(): Promise<Date> {
    const decodedAccessToken = await this.decodeAccessToken();
    if (typeof decodedAccessToken.exp === "undefined") {
      return null;
    }

    const d = new Date(0); // The 0 here is the key, which sets the date to the epoch
    d.setUTCSeconds(decodedAccessToken.exp);
    return d;
  }

  async accessTokenSecondsRemaining(offsetSeconds = 0): Promise<number> {
    const expDate = await this.getAccessTokenExpirationDate();
    if (expDate == null) {
      return 0;
    }

    const msRemaining = expDate.valueOf() - (new Date().valueOf() + offsetSeconds * 1000);
    return Math.round(msRemaining / 1000);
  }

  async accessTokenNeedsRefresh(minutes = 5): Promise<boolean> {
    const sRemaining = await this.accessTokenSecondsRemaining();
    return sRemaining < 60 * minutes;
  }

  async getUserIdFromAccessToken(): Promise<string> {
    const decoded = await this.decodeAccessToken();
    if (typeof decoded.sub === "undefined") {
      throw new Error("No user id found");
    }

    return decoded.sub as string;
  }

  async getEmailFromAccessToken(): Promise<string> {
    const decoded = await this.decodeAccessToken();
    if (typeof decoded.email === "undefined") {
      throw new Error("No email found");
    }

    return decoded.email as string;
  }

  async getEmailVerifiedFromAccessToken(): Promise<boolean> {
    const decoded = await this.decodeAccessToken();
    if (typeof decoded.email_verified === "undefined") {
      throw new Error("No email verification found");
    }

    return decoded.email_verified as boolean;
  }

  async getNameFromAccessToken(): Promise<string> {
    const decoded = await this.decodeAccessToken();
    if (typeof decoded.name === "undefined") {
      return null;
    }

    return decoded.name as string;
  }

  async getIssuerFromAccessToken(): Promise<string> {
    const decoded = await this.decodeAccessToken();
    if (typeof decoded.iss === "undefined") {
      throw new Error("No issuer found");
    }

    return decoded.iss as string;
  }

  async getIsExternalFromAccessToken(): Promise<boolean> {
    const decoded = await this.decodeAccessToken();

    return Array.isArray(decoded.amr) && decoded.amr.includes("external");
  }
}

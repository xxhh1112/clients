import { ApiHelperService } from "../../abstractions/api-helper.service.abstraction";
import { AppIdService } from "../../abstractions/appId.service";
import { EnvironmentService } from "../../abstractions/environment.service";
import { PlatformUtilsService } from "../../abstractions/platformUtils.service";
import { Utils } from "../../misc/utils";
import { ErrorResponse } from "../../models/response/error.response";
import { TokenApiService as TokenApiServiceAbstraction } from "../abstractions/token-api.service.abstraction";
import { TokenService } from "../abstractions/token.service";
import { DeviceRequest } from "../models/request/identity-token/device.request";
import { PasswordTokenRequest } from "../models/request/identity-token/password-token.request";
import { SsoTokenRequest } from "../models/request/identity-token/sso-token.request";
import { TokenTwoFactorRequest } from "../models/request/identity-token/token-two-factor.request";
import { UserApiTokenRequest } from "../models/request/identity-token/user-api-token.request";
import { IdentityCaptchaResponse } from "../models/response/identity-captcha.response";
import { IdentityTokenResponse } from "../models/response/identity-token.response";
import { IdentityTwoFactorResponse } from "../models/response/identity-two-factor.response";

/**
 * Service for interacting with the Bitwarden Identity API for token management.
 */
export class TokenApiServiceImplementation implements TokenApiServiceAbstraction {
  private identityBaseUrl: string = this.environmentService.getIdentityUrl();

  constructor(
    private platformUtilsService: PlatformUtilsService,
    private environmentService: EnvironmentService,
    private tokenService: TokenService,
    private appIdService: AppIdService,
    private apiHelperService: ApiHelperService
  ) {}

  async getActiveBearerToken(): Promise<string> {
    let accessToken = await this.tokenService.getToken();
    if (await this.tokenService.tokenNeedsRefresh()) {
      await this.doAuthRefresh();
      accessToken = await this.tokenService.getToken();
    }
    return accessToken;
  }

  async postIdentityToken(
    request: UserApiTokenRequest | PasswordTokenRequest | SsoTokenRequest
  ): Promise<IdentityTokenResponse | IdentityTwoFactorResponse | IdentityCaptchaResponse> {
    const identityToken =
      request instanceof UserApiTokenRequest
        ? request.toIdentityToken()
        : request.toIdentityToken(this.platformUtilsService.getClientType());

    const fetchReq = await this.apiHelperService.createRequest(
      "POST",
      `${this.identityBaseUrl}/connect/token`,
      identityToken,
      true,
      request.alterIdentityTokenHeaders
    );

    const response = await this.apiHelperService.fetch(fetchReq);

    let responseJson: any = null;
    if (this.apiHelperService.isJsonResponse(response)) {
      responseJson = await response.json();
    }

    if (responseJson != null) {
      if (response.status === 200) {
        return new IdentityTokenResponse(responseJson);
      } else if (
        response.status === 400 &&
        responseJson.TwoFactorProviders2 &&
        Object.keys(responseJson.TwoFactorProviders2).length
      ) {
        await this.tokenService.clearTwoFactorToken();
        return new IdentityTwoFactorResponse(responseJson);
      } else if (
        response.status === 400 &&
        responseJson.HCaptcha_SiteKey &&
        Object.keys(responseJson.HCaptcha_SiteKey).length
      ) {
        return new IdentityCaptchaResponse(responseJson);
      }
    }

    return Promise.reject(new ErrorResponse(responseJson, response.status, true));
  }

  async refreshIdentityToken(): Promise<any> {
    try {
      await this.doAuthRefresh();
    } catch (e) {
      return Promise.reject(null);
    }
  }

  private async doAuthRefresh(): Promise<void> {
    const refreshToken = await this.tokenService.getRefreshToken();
    if (refreshToken != null && refreshToken !== "") {
      return this.doRefreshToken();
    }

    const clientId = await this.tokenService.getClientId();
    const clientSecret = await this.tokenService.getClientSecret();
    if (!Utils.isNullOrWhitespace(clientId) && !Utils.isNullOrWhitespace(clientSecret)) {
      return this.doApiTokenRefresh();
    }

    throw new Error("Cannot refresh token, no refresh token or api keys are stored");
  }

  private async doRefreshToken(): Promise<void> {
    const refreshToken = await this.tokenService.getRefreshToken();
    if (refreshToken == null || refreshToken === "") {
      throw new Error();
    }

    const decodedToken = await this.tokenService.decodeToken();

    const requestBody = this.apiHelperService.qsStringify({
      grant_type: "refresh_token",
      client_id: decodedToken.client_id,
      refresh_token: refreshToken,
    });

    const fetchReq = await this.apiHelperService.createRequest(
      "POST",
      `${this.identityBaseUrl}/connect/token`,
      requestBody,
      true
    );

    const response = await this.apiHelperService.fetch(fetchReq);

    if (response.status === 200) {
      const responseJson = await response.json();
      const tokenResponse = new IdentityTokenResponse(responseJson);
      await this.tokenService.setTokens(
        tokenResponse.accessToken,
        tokenResponse.refreshToken,
        null
      );
    } else {
      const error = await this.apiHelperService.handleError(response, true, true);
      return Promise.reject(error);
    }
  }

  private async doApiTokenRefresh(): Promise<void> {
    const clientId = await this.tokenService.getClientId();
    const clientSecret = await this.tokenService.getClientSecret();

    const appId = await this.appIdService.getAppId();
    const deviceRequest = new DeviceRequest(appId, this.platformUtilsService);
    const tokenRequest = new UserApiTokenRequest(
      clientId,
      clientSecret,
      new TokenTwoFactorRequest(),
      deviceRequest
    );

    const response = await this.postIdentityToken(tokenRequest);
    if (!(response instanceof IdentityTokenResponse)) {
      throw new Error("Invalid response received when refreshing api token");
    }

    await this.tokenService.setToken(response.accessToken);
  }
}

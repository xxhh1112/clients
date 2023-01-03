import { mock, MockProxy } from "jest-mock-extended";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { AppIdService } from "@bitwarden/common/abstractions/appId.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { KeyConnectorService } from "@bitwarden/common/abstractions/keyConnector.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { TokenService } from "@bitwarden/common/abstractions/token.service";
import { TwoFactorService } from "@bitwarden/common/abstractions/twoFactor.service";
import { SsoLogInStrategy } from "@bitwarden/common/misc/logInStrategies/ssoLogin.strategy";
import { Utils } from "@bitwarden/common/misc/utils";
import { SsoLogInCredentials } from "@bitwarden/common/models/domain/log-in-credentials";

import { InternalAccountService } from "../../../src/abstractions/account/account.service";

import { identityTokenResponseFactory } from "./logIn.strategy.spec";

describe("SsoLogInStrategy", () => {
  let cryptoService: MockProxy<CryptoService>;
  let apiService: MockProxy<ApiService>;
  let tokenService: MockProxy<TokenService>;
  let appIdService: MockProxy<AppIdService>;
  let platformUtilsService: MockProxy<PlatformUtilsService>;
  let messagingService: MockProxy<MessagingService>;
  let logService: MockProxy<LogService>;
  let stateService: MockProxy<StateService>;
  let accountService: MockProxy<InternalAccountService>;
  let twoFactorService: MockProxy<TwoFactorService>;
  let keyConnectorService: MockProxy<KeyConnectorService>;

  let ssoLogInStrategy: SsoLogInStrategy;
  let credentials: SsoLogInCredentials;

  const deviceId = Utils.newGuid();
  const keyConnectorUrl = "KEY_CONNECTOR_URL";

  const ssoCode = "SSO_CODE";
  const ssoCodeVerifier = "SSO_CODE_VERIFIER";
  const ssoRedirectUrl = "SSO_REDIRECT_URL";
  const ssoOrgId = "SSO_ORG_ID";

  beforeEach(async () => {
    cryptoService = mock();
    apiService = mock();
    tokenService = mock();
    appIdService = mock();
    platformUtilsService = mock();
    messagingService = mock();
    logService = mock();
    stateService = mock();
    accountService = mock();
    twoFactorService = mock();
    keyConnectorService = mock();

    tokenService.getTwoFactorToken.mockResolvedValue(null);
    appIdService.getAppId.mockResolvedValue(deviceId);
    tokenService.decodeToken.mockResolvedValue({});

    ssoLogInStrategy = new SsoLogInStrategy(
      cryptoService,
      apiService,
      tokenService,
      appIdService,
      platformUtilsService,
      messagingService,
      logService,
      stateService,
      twoFactorService,
      accountService,
      keyConnectorService
    );
    credentials = new SsoLogInCredentials(ssoCode, ssoCodeVerifier, ssoRedirectUrl, ssoOrgId);
  });

  it("sends SSO information to server", async () => {
    apiService.postIdentityToken.mockResolvedValue(identityTokenResponseFactory());

    await ssoLogInStrategy.logIn(credentials);

    expect(apiService.postIdentityToken).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ssoCode,
        codeVerifier: ssoCodeVerifier,
        redirectUri: ssoRedirectUrl,
        device: expect.objectContaining({
          identifier: deviceId,
        }),
        twoFactor: expect.objectContaining({
          provider: null,
          token: null,
        }),
      })
    );
  });

  it("does not set keys for new SSO user flow", async () => {
    const tokenResponse = identityTokenResponseFactory();
    tokenResponse.key = null;
    apiService.postIdentityToken.mockResolvedValue(tokenResponse);

    await ssoLogInStrategy.logIn(credentials);

    expect(cryptoService.setEncPrivateKey).not.toHaveBeenCalled();
    expect(cryptoService.setEncKey).not.toHaveBeenCalled();
  });

  it("gets and sets KeyConnector key for enrolled user", async () => {
    const tokenResponse = identityTokenResponseFactory();
    tokenResponse.keyConnectorUrl = keyConnectorUrl;

    apiService.postIdentityToken.mockResolvedValue(tokenResponse);

    await ssoLogInStrategy.logIn(credentials);

    expect(keyConnectorService.getAndSetKey).toHaveBeenCalledWith(keyConnectorUrl);
  });

  it("converts new SSO user to Key Connector on first login", async () => {
    const tokenResponse = identityTokenResponseFactory();
    tokenResponse.keyConnectorUrl = keyConnectorUrl;
    tokenResponse.key = null;

    apiService.postIdentityToken.mockResolvedValue(tokenResponse);

    await ssoLogInStrategy.logIn(credentials);

    expect(keyConnectorService.convertNewSsoUserToKeyConnector).toHaveBeenCalledWith(
      tokenResponse,
      ssoOrgId
    );
  });
});

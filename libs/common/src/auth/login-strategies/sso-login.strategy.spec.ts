import { mock, MockProxy } from "jest-mock-extended";

import { ApiService } from "../../abstractions/api.service";
import { AppIdService } from "../../platform/abstractions/app-id.service";
import { CryptoService } from "../../platform/abstractions/crypto.service";
import { LogService } from "../../platform/abstractions/log.service";
import { MessagingService } from "../../platform/abstractions/messaging.service";
import { PlatformUtilsService } from "../../platform/abstractions/platform-utils.service";
import { StateService } from "../../platform/abstractions/state.service";
import { Utils } from "../../platform/misc/utils";
import {
  MasterKey,
  SymmetricCryptoKey,
  UserKey,
} from "../../platform/models/domain/symmetric-crypto-key";
import { CsprngArray } from "../../types/csprng";
import { KeyConnectorService } from "../abstractions/key-connector.service";
import { TokenService } from "../abstractions/token.service";
import { TwoFactorService } from "../abstractions/two-factor.service";
import { SsoLogInCredentials } from "../models/domain/log-in-credentials";
import { IdentityTokenResponse } from "../models/response/identity-token.response";

import { identityTokenResponseFactory } from "./login.strategy.spec";
import { SsoLogInStrategy } from "./sso-login.strategy";

describe("SsoLogInStrategy", () => {
  let cryptoService: MockProxy<CryptoService>;
  let apiService: MockProxy<ApiService>;
  let tokenService: MockProxy<TokenService>;
  let appIdService: MockProxy<AppIdService>;
  let platformUtilsService: MockProxy<PlatformUtilsService>;
  let messagingService: MockProxy<MessagingService>;
  let logService: MockProxy<LogService>;
  let stateService: MockProxy<StateService>;
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
    cryptoService = mock<CryptoService>();
    apiService = mock<ApiService>();
    tokenService = mock<TokenService>();
    appIdService = mock<AppIdService>();
    platformUtilsService = mock<PlatformUtilsService>();
    messagingService = mock<MessagingService>();
    logService = mock<LogService>();
    stateService = mock<StateService>();
    twoFactorService = mock<TwoFactorService>();
    keyConnectorService = mock<KeyConnectorService>();

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

    expect(cryptoService.setMasterKey).not.toHaveBeenCalled();
    expect(cryptoService.setUserKey).not.toHaveBeenCalled();
    expect(cryptoService.setPrivateKey).not.toHaveBeenCalled();
  });

  describe("Key Connector", () => {
    let tokenResponse: IdentityTokenResponse;
    beforeEach(() => {
      tokenResponse = identityTokenResponseFactory();
      tokenResponse.keyConnectorUrl = keyConnectorUrl;
    });

    it("gets and sets the master key if Key Connector is enabled", async () => {
      const masterKey = new SymmetricCryptoKey(
        new Uint8Array(64).buffer as CsprngArray
      ) as MasterKey;

      apiService.postIdentityToken.mockResolvedValue(tokenResponse);
      cryptoService.getMasterKey.mockResolvedValue(masterKey);

      await ssoLogInStrategy.logIn(credentials);

      expect(keyConnectorService.getAndSetMasterKey).toHaveBeenCalledWith(keyConnectorUrl);
    });

    it("converts new SSO user to Key Connector on first login", async () => {
      tokenResponse.key = null;

      apiService.postIdentityToken.mockResolvedValue(tokenResponse);

      await ssoLogInStrategy.logIn(credentials);

      expect(keyConnectorService.convertNewSsoUserToKeyConnector).toHaveBeenCalledWith(
        tokenResponse,
        ssoOrgId
      );
    });

    it("decrypts and sets the user key if Key Connector is enabled", async () => {
      const userKey = new SymmetricCryptoKey(new Uint8Array(64).buffer as CsprngArray) as UserKey;
      const masterKey = new SymmetricCryptoKey(
        new Uint8Array(64).buffer as CsprngArray
      ) as MasterKey;

      apiService.postIdentityToken.mockResolvedValue(tokenResponse);
      cryptoService.getMasterKey.mockResolvedValue(masterKey);
      cryptoService.decryptUserKeyWithMasterKey.mockResolvedValue(userKey);

      await ssoLogInStrategy.logIn(credentials);

      expect(cryptoService.decryptUserKeyWithMasterKey).toHaveBeenCalledWith(masterKey);
      expect(cryptoService.setUserKey).toHaveBeenCalledWith(userKey);
    });
  });
});

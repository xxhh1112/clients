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
  UserSymKey,
} from "../../platform/models/domain/symmetric-crypto-key";
import { CsprngArray } from "../../types/csprng";
import { TokenService } from "../abstractions/token.service";
import { TwoFactorService } from "../abstractions/two-factor.service";
import { PasswordlessLogInCredentials } from "../models/domain/log-in-credentials";
import { IdentityTokenResponse } from "../models/response/identity-token.response";

import { identityTokenResponseFactory } from "./login.strategy.spec";
import { PasswordlessLogInStrategy } from "./passwordless-login.strategy";

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

  let passwordlessLoginStrategy: PasswordlessLogInStrategy;
  let credentials: PasswordlessLogInCredentials;
  let tokenResponse: IdentityTokenResponse;

  const deviceId = Utils.newGuid();

  const email = "EMAIL";
  const accessCode = "ACCESS_CODE";
  const authRequestId = "AUTH_REQUEST_ID";
  const decKey = new SymmetricCryptoKey(new Uint8Array(64).buffer as CsprngArray) as MasterKey;
  const localPasswordHash = "LOCAL_PASSWORD_HASH";

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

    tokenService.getTwoFactorToken.mockResolvedValue(null);
    appIdService.getAppId.mockResolvedValue(deviceId);
    tokenService.decodeToken.mockResolvedValue({});

    passwordlessLoginStrategy = new PasswordlessLogInStrategy(
      cryptoService,
      apiService,
      tokenService,
      appIdService,
      platformUtilsService,
      messagingService,
      logService,
      stateService,
      twoFactorService
    );
    credentials = new PasswordlessLogInCredentials(
      email,
      accessCode,
      authRequestId,
      decKey,
      localPasswordHash
    );

    tokenResponse = identityTokenResponseFactory();
    apiService.postIdentityToken.mockResolvedValue(tokenResponse);
  });

  it("sets keys after a successful authentication", async () => {
    const masterKey = new SymmetricCryptoKey(new Uint8Array(64).buffer as CsprngArray) as MasterKey;
    const userSymKey = new SymmetricCryptoKey(
      new Uint8Array(64).buffer as CsprngArray
    ) as UserSymKey;

    cryptoService.getMasterKey.mockResolvedValue(masterKey);
    cryptoService.decryptUserSymKeyWithMasterKey.mockResolvedValue(userSymKey);

    await passwordlessLoginStrategy.logIn(credentials);

    expect(cryptoService.setMasterKey).toHaveBeenCalledWith(masterKey);
    expect(cryptoService.setKeyHash).toHaveBeenCalledWith(localPasswordHash);
    expect(cryptoService.setUserSymKeyMasterKey).toHaveBeenCalledWith(tokenResponse.key);
    expect(cryptoService.setUserKey).toHaveBeenCalledWith(userSymKey);
    expect(cryptoService.setPrivateKey).toHaveBeenCalledWith(tokenResponse.privateKey);
  });
});

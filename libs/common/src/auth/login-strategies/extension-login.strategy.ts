import { ApiService } from "../../abstractions/api.service";
import { AppIdService } from "../../platform/abstractions/app-id.service";
import { CryptoService } from "../../platform/abstractions/crypto.service";
import { LogService } from "../../platform/abstractions/log.service";
import { MessagingService } from "../../platform/abstractions/messaging.service";
import { PlatformUtilsService } from "../../platform/abstractions/platform-utils.service";
import { StateService } from "../../platform/abstractions/state.service";
import { EncString } from "../../platform/models/domain/enc-string";
import { SymmetricCryptoKey, UserKey } from "../../platform/models/domain/symmetric-crypto-key";
import { AuthService } from "../abstractions/auth.service";
import { TokenService } from "../abstractions/token.service";
import { TwoFactorService } from "../abstractions/two-factor.service";
import { AuthResult } from "../models/domain/auth-result";
import { ExtensionLogInCredentials } from "../models/domain/log-in-credentials";
import { ExtensionTokenRequest } from "../models/request/identity-token/extension-token.request";
import { TokenTwoFactorRequest } from "../models/request/identity-token/token-two-factor.request";
import { IdentityTokenResponse } from "../models/response/identity-token.response";

import { LogInStrategy } from "./login.strategy";

export class ExtensionLogInStrategy extends LogInStrategy {
  get email() {
    if ("email" in this.tokenRequest) {
      return this.tokenRequest.email;
    }

    return "";
  }

  get accessCode() {
    return "";
  }

  get authRequestId() {
    return "";
  }

  tokenRequest: ExtensionTokenRequest;
  private credentials: ExtensionLogInCredentials;

  constructor(
    cryptoService: CryptoService,
    apiService: ApiService,
    tokenService: TokenService,
    appIdService: AppIdService,
    platformUtilsService: PlatformUtilsService,
    messagingService: MessagingService,
    logService: LogService,
    stateService: StateService,
    twoFactorService: TwoFactorService,
    private authService: AuthService
  ) {
    super(
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
  }

  protected setMasterKey(response: IdentityTokenResponse) {
    return Promise.resolve();
  }

  protected async setUserKey(response: IdentityTokenResponse) {
    const encPrivateKey = new EncString(response.prfPrivateKey);
    const privateKey = await this.cryptoService.decryptToBytes(
      encPrivateKey,
      this.credentials.prfKey
    );
    const userKey = await this.cryptoService.rsaDecrypt(response.userKey, privateKey);
    await this.cryptoService.setUserKey(new SymmetricCryptoKey(userKey) as UserKey);
    // await this.cryptoService.setKeyHash(this.passwordlessCredentials.localPasswordHash);
  }

  protected setPrivateKey(response: IdentityTokenResponse): Promise<void> {
    return Promise.resolve();
  }

  async logInTwoFactor(
    twoFactor: TokenTwoFactorRequest,
    captchaResponse: string
  ): Promise<AuthResult> {
    // this.tokenRequest.captchaResponse = captchaResponse ?? this.captchaBypassToken;
    return super.logInTwoFactor(twoFactor, captchaResponse);
  }

  async logIn(credentials: ExtensionLogInCredentials) {
    this.credentials = credentials;

    this.tokenRequest = new ExtensionTokenRequest(
      credentials.token,
      await this.buildTwoFactor(credentials.twoFactor),
      await this.buildDeviceRequest()
    );

    const [authResult] = await this.startLogIn();
    return authResult;
  }
}

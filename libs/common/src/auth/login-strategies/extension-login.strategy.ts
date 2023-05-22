import { ApiService } from "../../abstractions/api.service";
import { AppIdService } from "../../abstractions/appId.service";
import { CryptoService } from "../../abstractions/crypto.service";
import { LogService } from "../../abstractions/log.service";
import { MessagingService } from "../../abstractions/messaging.service";
import { PlatformUtilsService } from "../../abstractions/platformUtils.service";
import { StateService } from "../../abstractions/state.service";
import { AuthService } from "../abstractions/auth.service";
import { TokenService } from "../abstractions/token.service";
import { TwoFactorService } from "../abstractions/two-factor.service";
import { AuthResult } from "../models/domain/auth-result";
import { ExtensionLogInCredentials } from "../models/domain/log-in-credentials";
import { ExtensionTokenRequest } from "../models/request/identity-token/extension-token.request";
import { TokenTwoFactorRequest } from "../models/request/identity-token/token-two-factor.request";

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
  private passwordlessCredentials: ExtensionLogInCredentials;

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

  async setUserKey() {
    // await this.cryptoService.setKey(this.passwordlessCredentials.decKey);
    // await this.cryptoService.setKeyHash(this.passwordlessCredentials.localPasswordHash);
  }

  async logInTwoFactor(
    twoFactor: TokenTwoFactorRequest,
    captchaResponse: string
  ): Promise<AuthResult> {
    // this.tokenRequest.captchaResponse = captchaResponse ?? this.captchaBypassToken;
    return super.logInTwoFactor(twoFactor);
  }

  async logIn(credentials: ExtensionLogInCredentials) {
    this.passwordlessCredentials = credentials;

    this.tokenRequest = new ExtensionTokenRequest(
      credentials.token,
      await this.buildTwoFactor(credentials.twoFactor),
      await this.buildDeviceRequest()
    );

    const [authResult] = await this.startLogIn();
    return authResult;
  }
}

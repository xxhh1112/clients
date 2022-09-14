import { ApiService } from "../../abstractions/api.service";
import { AppIdService } from "../../abstractions/appId.service";
import { AuthService } from "../../abstractions/auth.service";
import { CryptoService } from "../../abstractions/crypto.service";
import { LogService } from "../../abstractions/log.service";
import { MessagingService } from "../../abstractions/messaging.service";
import { PlatformUtilsService } from "../../abstractions/platformUtils.service";
import { StateService } from "../../abstractions/state.service";
import { TokenService } from "../../abstractions/token.service";
import { TwoFactorService } from "../../abstractions/twoFactor.service";
import { HashPurpose } from "../../enums/hashPurpose";
import { AuthResult } from "../../models/domain/authResult";
import { PasswordlessLogInCredentials } from "../../models/domain/logInCredentials";
import { SymmetricCryptoKey } from "../../models/domain/symmetricCryptoKey";
import { PasswordTokenRequest } from "../../models/request/identityToken/passwordTokenRequest";
import { TokenRequestTwoFactor } from "../../models/request/identityToken/tokenRequestTwoFactor";

import { LogInStrategy } from "./logIn.strategy";

export class PasswordlessLogInStrategy extends LogInStrategy {
  get email() {
    return this.tokenRequest.email;
  }

  get masterPasswordHash() {
    return this.tokenRequest.masterPasswordHash;
  }

  tokenRequest: PasswordTokenRequest;

  private localHashedPassword: string;
  private key: SymmetricCryptoKey;

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

  async onSuccessfulLogin() {
    await this.cryptoService.setKey(this.key);
    await this.cryptoService.setKeyHash(this.localHashedPassword);
  }

  async logInTwoFactor(
    twoFactor: TokenRequestTwoFactor,
    captchaResponse: string
  ): Promise<AuthResult> {
    this.tokenRequest.captchaResponse = captchaResponse ?? this.captchaBypassToken;
    return super.logInTwoFactor(twoFactor);
  }

  async logIn(credentials: PasswordlessLogInCredentials) {
    const { email, masterPasswordHashB64, decKey, twoFactor } = credentials;

    let hashedPassword: string = null;
    this.localHashedPassword = masterPasswordHashB64
    this.key = decKey
    hashedPassword = masterPasswordHashB64

    this.tokenRequest = new PasswordTokenRequest(
      email,
      hashedPassword,
      null,
      await this.buildTwoFactor(twoFactor),
      await this.buildDeviceRequest()
    );

    return this.startLogIn();
  }
}

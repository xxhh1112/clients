import { ApiService } from "../../abstractions/api.service";
import { AppIdService } from "../../platform/abstractions/app-id.service";
import { CryptoService } from "../../platform/abstractions/crypto.service";
import { LogService } from "../../platform/abstractions/log.service";
import { MessagingService } from "../../platform/abstractions/messaging.service";
import { PlatformUtilsService } from "../../platform/abstractions/platform-utils.service";
import { StateService } from "../../platform/abstractions/state.service";
import { KeyConnectorService } from "../abstractions/key-connector.service";
import { TokenService } from "../abstractions/token.service";
import { TwoFactorService } from "../abstractions/two-factor.service";
import { SsoLogInCredentials } from "../models/domain/log-in-credentials";
import { SsoTokenRequest } from "../models/request/identity-token/sso-token.request";
import { IdentityTokenResponse } from "../models/response/identity-token.response";

import { LogInStrategy } from "./login.strategy";

export class SsoLogInStrategy extends LogInStrategy {
  tokenRequest: SsoTokenRequest;
  orgId: string;

  // A session token server side to serve as an authentication factor for the user
  // in order to send email OTPs to the user's configured 2FA email address
  // as we don't have a master password hash or other verifiable secret when using SSO.
  ssoEmail2FaSessionToken?: string;
  email?: string; // email not preserved through SSO process so get from server

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
    private keyConnectorService: KeyConnectorService
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

  async logIn(credentials: SsoLogInCredentials) {
    this.orgId = credentials.orgId;
    this.tokenRequest = new SsoTokenRequest(
      credentials.code,
      credentials.codeVerifier,
      credentials.redirectUrl,
      await this.buildTwoFactor(credentials.twoFactor),
      await this.buildDeviceRequest()
    );

    const [ssoAuthResult] = await this.startLogIn();

    this.email = ssoAuthResult.email;
    this.ssoEmail2FaSessionToken = ssoAuthResult.ssoEmail2FaSessionToken;

    return ssoAuthResult;
  }

  protected override async setMasterKey(tokenResponse: IdentityTokenResponse) {
    const newSsoUser = tokenResponse.key == null;

    if (tokenResponse.keyConnectorUrl != null) {
      if (!newSsoUser) {
        await this.keyConnectorService.getAndSetMasterKey(tokenResponse.keyConnectorUrl);
      } else {
        await this.keyConnectorService.convertNewSsoUserToKeyConnector(tokenResponse, this.orgId);
      }
    }
  }

  protected override async setUserKey(tokenResponse: IdentityTokenResponse): Promise<void> {
    const newSsoUser = tokenResponse.key == null;

    if (!newSsoUser) {
      // TODO: check if TDE feature flag enabled and if token response account decryption options has TDE
      // and then if id token response has required device keys
      // DevicePublicKey(UserKey)
      // UserKey(DevicePublicKey)
      // DeviceKey(DevicePrivateKey)

      // Once we have device keys coming back on id token response we can use this code
      // const userKey = await this.deviceCryptoService.decryptUserKey(
      //   encryptedDevicePrivateKey,
      //   encryptedUserKey
      // );
      // await this.cryptoService.setUserKey(userKey);

      // TODO: also admin approval request existence check should go here b/c that can give us a decrypted user key to set
      // TODO: future passkey login strategy will need to support setting user key (decrypting via TDE or admin approval request)
      // so might be worth moving this logic to a common place (base login strategy or a separate service?)

      await this.cryptoService.setUserKeyMasterKey(tokenResponse.key);

      if (tokenResponse.keyConnectorUrl != null) {
        const masterKey = await this.cryptoService.getMasterKey();
        if (!masterKey) {
          throw new Error("Master key not found");
        }
        const userKey = await this.cryptoService.decryptUserKeyWithMasterKey(masterKey);
        await this.cryptoService.setUserKey(userKey);
      }
    }
  }

  protected override async setPrivateKey(tokenResponse: IdentityTokenResponse): Promise<void> {
    const newSsoUser = tokenResponse.key == null;

    if (!newSsoUser) {
      await this.cryptoService.setPrivateKey(
        tokenResponse.privateKey ?? (await this.createKeyPairForOldAccount())
      );
    }
  }
}

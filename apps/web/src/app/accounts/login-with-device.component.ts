import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { defer, delay, from } from "rxjs";

import { CaptchaProtectedComponent } from "@bitwarden/angular/components/captchaProtected.component";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { AppIdService } from "@bitwarden/common/abstractions/appId.service";
import { AuthService } from "@bitwarden/common/abstractions/auth.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { CryptoFunctionService } from "@bitwarden/common/abstractions/cryptoFunction.service";
import { EnvironmentService } from "@bitwarden/common/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PasswordGenerationService } from "@bitwarden/common/abstractions/passwordGeneration.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { AuthRequestType } from "@bitwarden/common/enums/authRequestType";
import { Utils } from "@bitwarden/common/misc/utils";
import { PasswordLogInCredentials } from "@bitwarden/common/models/domain/logInCredentials";
import { TokenRequestPasswordless } from "@bitwarden/common/models/request/identityToken/tokenRequestPasswordless";
import { PasswordlessCreateAuthRequest } from "@bitwarden/common/models/request/passwordlessCreateAuthRequest";
import { AuthRequestResponse } from "@bitwarden/common/models/response/authRequestResponse";

@Component({
  selector: "app-login-with-device",
  templateUrl: "login-with-device.component.html",
})
export class LoginWithDeviceComponent extends CaptchaProtectedComponent implements OnInit {
  fingerPrint: string;
  email: string;
  onSuccessfulLoginTwoFactorNavigate: () => Promise<any>;
  onSuccessfulLogin: () => Promise<any>;
  onSuccessfulLoginNavigate: () => Promise<any>;

  protected twoFactorRoute = "2fa";
  protected successRoute = "vault";

  constructor(
    private router: Router,
    private cryptoService: CryptoService,
    private cryptoFunctionService: CryptoFunctionService,
    private appIdService: AppIdService,
    private PasswordGenerationService: PasswordGenerationService,
    private apiService: ApiService,
    private authService: AuthService,
    private logService: LogService,
    private stateService: StateService,
    environmentService: EnvironmentService,
    i18nService: I18nService,
    platformUtilsService: PlatformUtilsService
  ) {
    super(environmentService, i18nService, platformUtilsService);

    const navigation = this.router.getCurrentNavigation();
    if (navigation) {
      this.email = navigation.extras?.state?.email;
    }
  }

  async ngOnInit() {
    if (!this.email) {
      this.router.navigate(["/login"]);
    }

    this.startPasswordlessLogin();
  }

  async startPasswordlessLogin() {
    const keypair = await this.cryptoFunctionService.rsaGenerateKeyPair(2048);
    const fingerprint = await (
      await this.cryptoService.getFingerprint(this.email, keypair[0])
    ).join("-");
    const deviceIdentifier = await this.appIdService.getAppId();
    const publicKey = Utils.fromBufferToB64(keypair[0]);
    const accessCode = await this.PasswordGenerationService.generatePassword({ length: 25 });
    let response: AuthRequestResponse = null;

    const request = new PasswordlessCreateAuthRequest(
      this.email,
      deviceIdentifier,
      publicKey,
      AuthRequestType.AuthenticateAndUnlock,
      accessCode,
      fingerprint
    );

    this.fingerPrint = fingerprint;

    const reqResponse = await this.apiService.postAuthRequest(request);

    //replace with signalR
    //delay and get response
    defer(() =>
      from(this.apiService.getAuthResponse(reqResponse.id, accessCode)).pipe(delay(2000))
    ).subscribe({
      next: (res: AuthRequestResponse) => {
        response = res;
      },
      error: (error) => this.logService.error(error),
    });

    if (response) {
      await this.setupCaptcha();

      // const decKey = await this.cryptoService.rsaDecrypt(response.key, keypair[1]);
      const decMasterPasswordHash = await this.cryptoService.rsaDecrypt(
        response.masterPasswordHash,
        keypair[1]
      );

      try {
        const masterPasswordHash = Utils.fromBufferToB64(decMasterPasswordHash);

        const credentials = new PasswordLogInCredentials(
          this.email,
          masterPasswordHash,
          this.captchaToken,
          null,
          new TokenRequestPasswordless(accessCode)
        );
        const loginResponse = await this.authService.logIn(credentials);

        if (this.handleCaptchaRequired(loginResponse)) {
          return;
        } else if (loginResponse.requiresTwoFactor) {
          if (this.onSuccessfulLoginTwoFactorNavigate != null) {
            this.onSuccessfulLoginTwoFactorNavigate();
          } else {
            this.router.navigate([this.twoFactorRoute]);
          }
        } else {
          const disableFavicon = await this.stateService.getDisableFavicon();
          await this.stateService.setDisableFavicon(!!disableFavicon);
          if (this.onSuccessfulLogin != null) {
            this.onSuccessfulLogin();
          }
          if (this.onSuccessfulLoginNavigate != null) {
            this.onSuccessfulLoginNavigate();
          } else {
            this.router.navigate([this.successRoute]);
          }
        }
      } catch (error) {
        this.logService.error(error);
      }
    }
  }
}

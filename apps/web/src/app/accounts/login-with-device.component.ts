import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { CaptchaProtectedComponent } from "@bitwarden/angular/components/captchaProtected.component";
import { AnonymousHubService } from "@bitwarden/common/abstractions/anonymousHub.service";
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
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetricCryptoKey";
import { PasswordlessLogInCredentials } from "@bitwarden/common/models/domain/logInCredentials";
import { PasswordlessCreateAuthRequest } from "@bitwarden/common/models/request/passwordlessCreateAuthRequest";

@Component({
  selector: "app-login-with-device",
  templateUrl: "login-with-device.component.html",
})
export class LoginWithDeviceComponent
  extends CaptchaProtectedComponent
  implements OnInit, OnDestroy
{
  private accessCode: string;
  private privateKeyValue: ArrayBuffer;
  private destroy$ = new Subject<void>();
  fingerPrint: string;
  email: string;
  resendNotification = false;
  onSuccessfulLoginTwoFactorNavigate: () => Promise<any>;
  onSuccessfulLogin: () => Promise<any>;
  onSuccessfulLoginNavigate: () => Promise<any>;

  protected twoFactorRoute = "2fa";
  protected successRoute = "vault";
  private keypair: [ArrayBuffer, ArrayBuffer];

  constructor(
    private router: Router,
    private cryptoService: CryptoService,
    private cryptoFunctionService: CryptoFunctionService,
    private appIdService: AppIdService,
    private passwordGenerationService: PasswordGenerationService,
    private apiService: ApiService,
    private authService: AuthService,
    private logService: LogService,
    private stateService: StateService,
    environmentService: EnvironmentService,
    i18nService: I18nService,
    platformUtilsService: PlatformUtilsService,
    private anonymousHubService: AnonymousHubService
  ) {
    super(environmentService, i18nService, platformUtilsService);

    const navigation = this.router.getCurrentNavigation();
    if (navigation) {
      this.email = navigation.extras?.state?.email;
    }

    //gets signalR push notification
    this.authService
      .getPushNotifcationObs$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        this.confirmResponse(id, this.accessCode, this.privateKeyValue);
      });
  }

  async ngOnInit() {
    if (!this.email) {
      this.router.navigate(["/login"]);
      return;
    }

    this.startPasswordlessLogin();
  }

  async startPasswordlessLogin() {
    this.resendNotification = false;
    this.keypair = await this.cryptoFunctionService.rsaGenerateKeyPair(2048);
    const fingerprint = await (
      await this.cryptoService.getFingerprint(this.email, this.keypair[0])
    ).join("-");
    const deviceIdentifier = await this.appIdService.getAppId();
    const publicKey = Utils.fromBufferToB64(this.keypair[0]);
    const accessCode = await this.passwordGenerationService.generatePassword({ length: 25 });

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

    if (reqResponse.id) {
      this.anonymousHubService.createHubConnection(reqResponse.id);
    }

    this.accessCode = accessCode;
    this.privateKeyValue = this.keypair[1];

    setTimeout(() => {
      this.resendNotification = true;
    }, 12000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.anonymousHubService.stopHubConnection();
  }

  private async confirmResponse(requestId: string, accessCode: string, privateKeyVal: ArrayBuffer) {
    const response = await this.apiService.getAuthResponse(requestId, accessCode);
    if (response.requestApproved) {
      const decKey = await this.cryptoService.rsaDecrypt(response.key, privateKeyVal);
      const decMasterPasswordHash = await this.cryptoService.rsaDecrypt(
        response.masterPasswordHash,
        privateKeyVal
      );
      const key = new SymmetricCryptoKey(decKey);
      const localHashedPassword = Utils.fromBufferToUtf8(decMasterPasswordHash);
      try {
        const credentials = new PasswordlessLogInCredentials(
          this.email,
          accessCode,
          requestId,
          key,
          localHashedPassword
        );
        await this.authService.logIn(credentials);
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
      } catch (error) {
        this.logService.error(error);
      }
    }
  }
}

import { Directive } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { first } from "rxjs/operators";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthResult } from "@bitwarden/common/auth/models/domain/auth-result";
import { ForceResetPasswordReason } from "@bitwarden/common/auth/models/domain/force-reset-password-reason";
import { SsoLogInCredentials } from "@bitwarden/common/auth/models/domain/log-in-credentials";
import { SsoPreValidateResponse } from "@bitwarden/common/auth/models/response/sso-pre-validate.response";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config.service.abstraction";
import { CryptoFunctionService } from "@bitwarden/common/platform/abstractions/crypto-function.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { AccountDecryptionOptions } from "@bitwarden/common/platform/models/domain/account";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/password";

@Directive()
export class SsoComponent {
  identifier: string;
  loggingIn = false;

  formPromise: Promise<AuthResult>;
  initiateSsoFormPromise: Promise<SsoPreValidateResponse>;
  onSuccessfulLogin: () => Promise<any>;
  onSuccessfulLoginNavigate: () => Promise<any>;
  onSuccessfulLoginTwoFactorNavigate: () => Promise<any>;
  onSuccessfulLoginChangePasswordNavigate: () => Promise<any>;
  onSuccessfulLoginForceResetNavigate: () => Promise<any>;

  protected twoFactorRoute = "2fa";
  protected successRoute = "lock";
  protected trustedDeviceEncRoute = "login-initiated";
  protected changePasswordRoute = "set-password";
  protected tdeLogin = "login-initiated";
  protected forcePasswordResetRoute = "update-temp-password";
  protected clientId: string;
  protected redirectUri: string;
  protected state: string;
  protected codeChallenge: string;

  constructor(
    protected authService: AuthService,
    protected router: Router,
    protected i18nService: I18nService,
    protected route: ActivatedRoute,
    protected stateService: StateService,
    protected platformUtilsService: PlatformUtilsService,
    protected apiService: ApiService,
    protected cryptoFunctionService: CryptoFunctionService,
    protected environmentService: EnvironmentService,
    protected passwordGenerationService: PasswordGenerationServiceAbstraction,
    protected logService: LogService,
    protected configService: ConfigServiceAbstraction
  ) {}

  async ngOnInit() {
    // eslint-disable-next-line rxjs/no-async-subscribe
    this.route.queryParams.pipe(first()).subscribe(async (qParams) => {
      if (qParams.code != null && qParams.state != null) {
        const codeVerifier = await this.stateService.getSsoCodeVerifier();
        const state = await this.stateService.getSsoState();
        const clientId = this.getValueFromState(qParams.state, "clientId");

        if (clientId != this.clientId) {
          // response is intended for another client
          // TODO: To we want to have a separate state for redirect to another client?
          // Maybe show some help text? "Continue login in another client"
          this.loggingIn = true;
          const clientUri = this.getValueFromState(qParams.state, "clientUri", true);
          this.platformUtilsService.launchUri(
            `${clientUri}?code=${qParams.code}&state=${qParams.state}`,
            { sameWindow: true }
          );
          return;
        }

        await this.stateService.setSsoCodeVerifier(null);
        await this.stateService.setSsoState(null);
        if (
          codeVerifier == null ||
          codeVerifier == null ||
          !this.checkState(state, qParams.state)
        ) {
          return;
        }

        await this.logIn(
          qParams.code,
          codeVerifier,
          this.getValueFromState(qParams.state, "identifier")
        );
      } else if (
        qParams.clientId != null &&
        qParams.redirectUri != null &&
        qParams.state != null &&
        qParams.codeChallenge != null
      ) {
        this.redirectUri = qParams.redirectUri;
        this.state = qParams.state;
        this.codeChallenge = qParams.codeChallenge;
        this.clientId = qParams.clientId;
      }
    });
  }

  async submit(returnUri?: string, includeUserIdentifier?: boolean) {
    if (this.identifier == null || this.identifier === "") {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("ssoValidationFailed"),
        this.i18nService.t("ssoIdentifierRequired")
      );
      return;
    }

    this.initiateSsoFormPromise = this.apiService.preValidateSso(this.identifier);
    const response = await this.initiateSsoFormPromise;

    const authorizeUrl = await this.buildAuthorizeUrl(
      returnUri,
      includeUserIdentifier,
      response.token
    );
    this.platformUtilsService.launchUri(authorizeUrl, { sameWindow: true });
  }

  protected async buildAuthorizeUrl(
    returnUri?: string,
    includeUserIdentifier?: boolean,
    token?: string
  ): Promise<string> {
    let codeChallenge = this.codeChallenge;
    let state = this.state;

    const passwordOptions: any = {
      type: "password",
      length: 64,
      uppercase: true,
      lowercase: true,
      numbers: true,
      special: false,
    };

    if (codeChallenge == null) {
      const codeVerifier = await this.passwordGenerationService.generatePassword(passwordOptions);
      const codeVerifierHash = await this.cryptoFunctionService.hash(codeVerifier, "sha256");
      codeChallenge = Utils.fromBufferToUrlB64(codeVerifierHash);
      await this.stateService.setSsoCodeVerifier(codeVerifier);
    }

    // Add Organization Identifier and clientId to state
    state += `_identifier=${this.identifier}`;
    state += `_clientId=${this.clientId}`;

    if (state == null) {
      state = await this.passwordGenerationService.generatePassword(passwordOptions);
      if (returnUri) {
        state += `_returnUri='${returnUri}'`;
      }
    } else if (this.clientId != "web") {
      state += `_clientUri='${encodeURIComponent(this.redirectUri)}'`;
    }

    // Save state (regardless of new or existing)
    await this.stateService.setSsoState(state);

    let authorizeUrl =
      this.environmentService.getIdentityUrl() +
      "/connect/authorize?" +
      "client_id=" +
      this.clientId +
      "&redirect_uri=" +
      encodeURIComponent(`${window.location.origin}/sso-connector.html`) +
      "&" +
      "response_type=code&scope=api offline_access&" +
      "state=" +
      state +
      "&code_challenge=" +
      codeChallenge +
      "&" +
      "code_challenge_method=S256&response_mode=query&" +
      "domain_hint=" +
      encodeURIComponent(this.identifier) +
      "&ssoToken=" +
      encodeURIComponent(token);

    if (includeUserIdentifier) {
      const userIdentifier = await this.apiService.getSsoUserIdentifier();
      authorizeUrl += `&user_identifier=${encodeURIComponent(userIdentifier)}`;
    }

    return authorizeUrl;
  }

  private async logIn(code: string, codeVerifier: string, orgIdFromState: string) {
    this.loggingIn = true;
    try {
      const credentials = new SsoLogInCredentials(
        code,
        codeVerifier,
        // TODO: Figure out why the real value doesn't work with the server
        "https://localhost:8080/sso-connector.html",
        // this.redirectUri,
        orgIdFromState
      );
      this.formPromise = this.authService.logIn(credentials);
      const response = await this.formPromise;

      const trustedDeviceEncryptionFeatureActive = await this.configService.getFeatureFlagBool(
        FeatureFlag.TrustedDeviceEncryption
      );

      const accountDecryptionOptions: AccountDecryptionOptions =
        await this.stateService.getAccountDecryptionOptions();

      if (response.requiresTwoFactor) {
        if (this.onSuccessfulLoginTwoFactorNavigate != null) {
          await this.onSuccessfulLoginTwoFactorNavigate();
        } else {
          this.router.navigate([this.twoFactorRoute], {
            queryParams: {
              identifier: orgIdFromState,
              sso: "true",
            },
          });
        }
      } else if (
        trustedDeviceEncryptionFeatureActive &&
        accountDecryptionOptions.trustedDeviceOption !== undefined
      ) {
        this.router.navigate([this.trustedDeviceEncRoute], {
          queryParams: {
            identifier: orgIdFromState,
          },
        });
      } else if (response.resetMasterPassword) {
        // TODO: for TDE, we are going to deprecate using response.resetMasterPassword
        // and instead rely on accountDecryptionOptions to determine if the user needs to set a password
        // Users are allowed to not have a MP if TDE feature enabled + TDE configured. Otherwise, they must set a MP
        // src: https://bitwarden.atlassian.net/browse/PM-2759?focusedCommentId=39438
        if (this.onSuccessfulLoginChangePasswordNavigate != null) {
          await this.onSuccessfulLoginChangePasswordNavigate();
        } else {
          this.router.navigate([this.changePasswordRoute], {
            queryParams: {
              identifier: orgIdFromState,
            },
          });
        }
      } else if (response.forcePasswordReset !== ForceResetPasswordReason.None) {
        if (this.onSuccessfulLoginForceResetNavigate != null) {
          await this.onSuccessfulLoginForceResetNavigate();
        } else {
          this.router.navigate([this.forcePasswordResetRoute]);
        }
      } else {
        if (this.onSuccessfulLogin != null) {
          await this.onSuccessfulLogin();
        }
        if (this.onSuccessfulLoginNavigate != null) {
          await this.onSuccessfulLoginNavigate();
        } else {
          this.router.navigate([this.successRoute]);
        }
      }
    } catch (e) {
      this.logService.error(e);

      // TODO: Key Connector Service should pass this error message to the logout callback instead of displaying here
      if (e.message === "Key Connector error") {
        this.platformUtilsService.showToast(
          "error",
          null,
          this.i18nService.t("ssoKeyConnectorError")
        );
      }
    }
    this.loggingIn = false;
  }

  private checkState(state: string, checkState: string): boolean {
    if (state === null || state === undefined) {
      return false;
    }
    if (checkState === null || checkState === undefined) {
      return false;
    }

    const stateSplit = state.split("_identifier=");
    const checkStateSplit = checkState.split("_identifier=");
    return stateSplit[0] === checkStateSplit[0];
  }

  private getValueFromState(state: string, propertyName: string, quoted = false): string | null {
    const regex = new RegExp(
      quoted ? `(?:_${propertyName}=')([^']*)` : `(?:_${propertyName}=)([^_]*)`
    );
    const results = regex.exec(state);

    if (!results || results.length < 2) {
      return null;
    }

    return results[1];
  }
}

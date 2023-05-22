import { Injectable, Optional } from "@angular/core";
import { from, Observable } from "rxjs";

import { ConfigServiceAbstraction } from "@bitwarden/common/abstractions/config/config.service.abstraction";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { ExtensionLogInCredentials } from "@bitwarden/common/auth/models/domain/log-in-credentials";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetric-crypto-key";

import { CredentialAssertionOptionsView } from "../../views/credential-assertion-options.view";
import { WebauthnAssertionView } from "../../views/webauthn-assertion.view";

import { AuthenticatorAssertionResponseRequest } from "./request/authenticator-assertion-response.request";
import { WebauthnAssertionResponseRequest } from "./request/webauthn-assertion-response.request";
import { createSymmetricKeyFromPrf, getLoginWithPrfSalt } from "./utils";
import { WebauthnApiService } from "./webauthn-api.service";

@Injectable({ providedIn: "root" })
export class WebauthnLoginService {
  private navigatorCredentials: CredentialsContainer;

  readonly enabled$: Observable<boolean>;

  constructor(
    private apiService: WebauthnApiService,
    private cryptoService: CryptoService,
    private authService: AuthService,
    private configService: ConfigServiceAbstraction,
    @Optional() navigatorCredentials?: CredentialsContainer,
    @Optional() private logService?: LogService
  ) {
    // Default parameters don't work when used with Angular DI
    this.navigatorCredentials = navigatorCredentials ?? navigator.credentials;
    this.enabled$ = from(this.configService.getFeatureFlagBool(FeatureFlag.PasswordlessLogin));
  }

  async getCredentialAssertionOptions(): Promise<CredentialAssertionOptionsView> {
    const response = await this.apiService.getCredentialAssertionOptions();
    return new CredentialAssertionOptionsView(response.options, response.token);
  }

  async assertCredential(
    credentialOptions: CredentialAssertionOptionsView
  ): Promise<WebauthnAssertionView> {
    const nativeOptions: CredentialRequestOptions = {
      publicKey: credentialOptions.options,
    };
    // TODO: Remove `any` when typescript typings add support for PRF
    nativeOptions.publicKey.extensions = {
      prf: { eval: { first: await getLoginWithPrfSalt() } },
    } as any;

    try {
      const response = await this.navigatorCredentials.get(nativeOptions);
      if (!(response instanceof PublicKeyCredential)) {
        return undefined;
      }
      // TODO: Remove `any` when typescript typings add support for PRF
      const prfResult = (response.getClientExtensionResults() as any).prf?.results?.first;
      let symmetricPrfKey: SymmetricCryptoKey | undefined;
      if (prfResult != undefined) {
        symmetricPrfKey = createSymmetricKeyFromPrf(prfResult);
      }

      const deviceResponse = new AuthenticatorAssertionResponseRequest(response);
      const request = new WebauthnAssertionResponseRequest(credentialOptions.token, deviceResponse);
      const token = await this.apiService.assertCredential(request);

      return new WebauthnAssertionView(token, symmetricPrfKey);
    } catch (error) {
      this.logService?.error(error);
      return undefined;
    }
  }

  async logIn(assertion: WebauthnAssertionView) {
    const credential = new ExtensionLogInCredentials(assertion.token, assertion.prfKey);
    const result = await this.authService.logIn(credential);
    return result;
  }
}

import { from, Observable } from "rxjs";

import { FeatureFlag } from "../../../enums/feature-flag.enum";
import { ConfigServiceAbstraction } from "../../../platform/abstractions/config/config.service.abstraction";
import { LogService } from "../../../platform/abstractions/log.service";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { AuthService } from "../../abstractions/auth.service";
import { WebauthnApiServiceAbstraction } from "../../abstractions/webauthn/webauthn-api.service.abstraction";
import { WebauthnLoginServiceAbstraction } from "../../abstractions/webauthn/webauthn-login.service.abstraction";
import { AuthResult } from "../../models/domain/auth-result";
import { ExtensionLogInCredentials } from "../../models/domain/log-in-credentials";
import { CredentialAssertionOptionsView } from "../../models/view/webauthn/credential-assertion-options.view";
import { WebauthnAssertionView } from "../../models/view/webauthn/webauthn-assertion.view";

import { AuthenticatorAssertionResponseRequest } from "./request/authenticator-assertion-response.request";
import { WebauthnAssertionResponseRequest } from "./request/webauthn-assertion-response.request";
import { createSymmetricKeyFromPrf, getLoginWithPrfSalt } from "./utils";

export class WebauthnLoginService implements WebauthnLoginServiceAbstraction {
  readonly enabled$: Observable<boolean>;

  constructor(
    private apiService: WebauthnApiServiceAbstraction,
    private authService: AuthService,
    private configService: ConfigServiceAbstraction,
    private navigatorCredentials: CredentialsContainer,
    private logService?: LogService
  ) {
    // Default parameters don't work when used with Angular DI
    this.enabled$ = from(this.configService.getFeatureFlagBool(FeatureFlag.PasswordlessLogin));
  }

  async getCredentialAssertionOptions(email?: string): Promise<CredentialAssertionOptionsView> {
    const response = await this.apiService.getCredentialAssertionOptions(email);
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

  async logIn(assertion: WebauthnAssertionView): Promise<AuthResult> {
    const credential = new ExtensionLogInCredentials(assertion.token, assertion.prfKey);
    const result = await this.authService.logIn(credential);
    return result;
  }
}

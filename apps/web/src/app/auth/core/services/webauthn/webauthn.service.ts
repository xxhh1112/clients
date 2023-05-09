import { Injectable, Optional } from "@angular/core";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { ErrorResponse } from "@bitwarden/common/models/response/error.response";
import { Verification } from "@bitwarden/common/types/verification";

import { CoreAuthModule } from "../../core.module";
import { CredentialCreateOptionsView } from "../../views/credential-create-options.view";

import { SaveCredentialRequest } from "./request/save-credential.request";
import { WebauthnAttestationResponseRequest } from "./request/webauthn-attestation-response.request";
import { WebauthnApiService } from "./webauthn-api.service";

@Injectable({ providedIn: CoreAuthModule })
export class WebauthnService {
  private credentials: CredentialsContainer;

  constructor(
    private apiService: WebauthnApiService,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    @Optional() credentials?: CredentialsContainer,
    @Optional() private logService?: LogService
  ) {
    // Default parameters don't work when used with Angular DI
    this.credentials = credentials ?? navigator.credentials;
  }

  async getCredentialCreateOptions(
    verification: Verification
  ): Promise<CredentialCreateOptionsView | undefined> {
    try {
      const response = await this.apiService.getCredentialCreateOptions(verification);
      return new CredentialCreateOptionsView(response.options, response.token);
    } catch (error) {
      if (error instanceof ErrorResponse && error.statusCode === 400) {
        this.platformUtilsService.showToast(
          "error",
          this.i18nService.t("error"),
          this.i18nService.t("invalidMasterPassword")
        );
      } else {
        this.logService?.error(error);
        this.platformUtilsService.showToast("error", null, this.i18nService.t("unexpectedError"));
      }
      return undefined;
    }
  }

  async createCredential(
    credentialOptions: CredentialCreateOptionsView
  ): Promise<PublicKeyCredential | undefined> {
    const nativeOptions: CredentialCreationOptions = {
      publicKey: credentialOptions.options,
    };

    try {
      const response = await this.credentials.create(nativeOptions);
      if (!(response instanceof PublicKeyCredential)) {
        return undefined;
      }
      return response;
    } catch (error) {
      this.logService?.error(error);
      return undefined;
    }
  }

  async saveCredential(
    credentialOptions: CredentialCreateOptionsView,
    deviceResponse: PublicKeyCredential,
    name: string
  ) {
    try {
      const request = new SaveCredentialRequest();
      request.deviceResponse = new WebauthnAttestationResponseRequest(deviceResponse);
      request.token = credentialOptions.token;
      request.name = name;
      await this.apiService.saveCredential(request);
      return true;
    } catch (error) {
      this.logService?.error(error);
      this.platformUtilsService.showToast("error", null, this.i18nService.t("unexpectedError"));
      return false;
    }
  }
}

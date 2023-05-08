import { Injectable, Optional } from "@angular/core";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { ErrorResponse } from "@bitwarden/common/models/response/error.response";
import { Verification } from "@bitwarden/common/types/verification";

import { CoreAuthModule } from "../../core.module";
import { NewCredentialOptionsView } from "../../views/new-credential-options.view";

import { WebauthnApiService } from "./webauthn-api.service";

type WebauthnCredentialView = unknown;

@Injectable({ providedIn: CoreAuthModule })
export class WebauthnService {
  private credentials: CredentialsContainer;

  constructor(
    private apiService: WebauthnApiService,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    @Optional() credentials: CredentialsContainer
  ) {
    // Default parameters don't work when used with Angular DI
    this.credentials = credentials ?? navigator.credentials;
  }

  async getNewCredentialOptions(
    verification: Verification
  ): Promise<NewCredentialOptionsView | undefined> {
    try {
      return { challenge: await this.apiService.getChallenge(verification) };
    } catch (error) {
      if (error instanceof ErrorResponse && error.statusCode === 400) {
        this.platformUtilsService.showToast(
          "error",
          this.i18nService.t("error"),
          this.i18nService.t("invalidMasterPassword")
        );
      } else {
        this.platformUtilsService.showToast("error", null, this.i18nService.t("unexpectedError"));
      }
      return undefined;
    }
  }

  async createCredential(
    credentialOptions: NewCredentialOptionsView
  ): Promise<WebauthnCredentialView | undefined> {
    const nativeOptions: CredentialCreationOptions = {
      publicKey: credentialOptions.challenge,
    };

    try {
      return await this.credentials.create(nativeOptions);
    } catch {
      return undefined;
    }
  }
}

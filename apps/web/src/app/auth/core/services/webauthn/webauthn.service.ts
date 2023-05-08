import { Injectable } from "@angular/core";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { ChallengeResponse } from "@bitwarden/common/auth/models/response/two-factor-web-authn.response";
import { ErrorResponse } from "@bitwarden/common/models/response/error.response";
import { Verification } from "@bitwarden/common/types/verification";

import { CoreAuthModule } from "../../core.module";

import { WebauthnApiService } from "./webauthn-api.service";

type WebauthnCredentialView = unknown;

export class UserVerificationFailedError extends Error {}

@Injectable({ providedIn: CoreAuthModule })
export class WebauthnService {
  constructor(
    private apiService: WebauthnApiService,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService
  ) {}

  async newCredentialOptions(verification: Verification): Promise<ChallengeResponse> {
    try {
      return await this.apiService.getChallenge(verification);
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

  async createCredential(challenge: ChallengeResponse): Promise<WebauthnCredentialView> {
    await new Promise((_, reject) => setTimeout(() => reject(new Error("Not implemented")), 1000));
    return undefined;
  }
}

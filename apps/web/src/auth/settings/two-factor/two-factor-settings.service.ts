import { Injectable } from "@angular/core";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { UserVerificationService } from "@bitwarden/common/abstractions/userVerification/userVerification.service.abstraction";
import { TwoFactorProviderType } from "@bitwarden/common/auth/enums/two-factor-provider-type";
import { TwoFactorProviderRequest } from "@bitwarden/common/auth/models/request/two-factor-provider.request";
import { Verification } from "@bitwarden/common/types/verification";

@Injectable()
export class TwoFactorSettingsService {
  constructor(
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    private userVerificationService: UserVerificationService,
    private apiService: ApiService
  ) {}

  async disable(secret: Verification, type: TwoFactorProviderType) {
    const confirmed = await this.platformUtilsService.showDialog(
      this.i18nService.t("twoStepDisableDesc"),
      this.i18nService.t("disable"),
      this.i18nService.t("yes"),
      this.i18nService.t("no"),
      "warning"
    );

    if (!confirmed) {
      return false;
    }

    const request = await this.userVerificationService.buildRequest(
      secret,
      TwoFactorProviderRequest
    );
    request.type = type;
    await this.apiService.putTwoFactorDisable(request);

    this.platformUtilsService.showToast("success", null, this.i18nService.t("twoStepDisabled"));

    return true;
  }
}

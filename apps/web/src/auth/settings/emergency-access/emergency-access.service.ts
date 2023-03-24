import { Injectable } from "@angular/core";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";

@Injectable()
export class EmergencyAccessService {
  constructor(
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    private apiService: ApiService
  ) {}
  
  async delete(id: string, name: string) {
    const confirmed = await this.platformUtilsService.showDialog(
      this.i18nService.t("removeUserConfirmation"),
      name,
      this.i18nService.t("yes"),
      this.i18nService.t("no"),
      "warning"
    );

    if (!confirmed) {
      return false;
    }

    await this.apiService.deleteEmergencyAccess(id);
    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("removedUserId", name)
    );

    return true;
  }
}

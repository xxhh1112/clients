import { Component, EventEmitter, Input, Output } from "@angular/core";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { OrganizationApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization-api.service.abstraction";
import { AccountApiService } from "@bitwarden/common/auth/abstractions/account-api.service";
import { TokenApiService } from "@bitwarden/common/auth/abstractions/token-api.service.abstraction";

@Component({
  selector: "app-update-license",
  templateUrl: "update-license.component.html",
})
export class UpdateLicenseComponent {
  @Input() organizationId: string;
  @Input() showCancel = true;
  @Output() onUpdated = new EventEmitter();
  @Output() onCanceled = new EventEmitter();

  formPromise: Promise<void>;

  constructor(
    private accountApiService: AccountApiService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
    private logService: LogService,
    private organizationApiService: OrganizationApiServiceAbstraction,
    private tokenApiService: TokenApiService
  ) {}

  async submit() {
    const fileEl = document.getElementById("file") as HTMLInputElement;
    const files = fileEl.files;
    if (files == null || files.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("selectFile")
      );
      return;
    }

    try {
      const fd = new FormData();
      fd.append("license", files[0]);

      let updatePromise: Promise<void | unknown> = null;
      if (this.organizationId == null) {
        updatePromise = this.accountApiService.postAccountLicense(fd);
      } else {
        updatePromise = this.organizationApiService.updateLicense(this.organizationId, fd);
      }

      this.formPromise = updatePromise.then(() => {
        return this.tokenApiService.refreshAccessToken();
      });

      await this.formPromise;
      this.platformUtilsService.showToast(
        "success",
        null,
        this.i18nService.t("licenseUploadSuccess")
      );
      this.onUpdated.emit();
    } catch (e) {
      this.logService.error(e);
    }
  }

  cancel() {
    this.onCanceled.emit();
  }
}

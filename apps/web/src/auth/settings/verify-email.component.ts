import { Component, EventEmitter, Output } from "@angular/core";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { AccountApiService } from "@bitwarden/common/auth/abstractions/account-api.service";
import { TokenApiService } from "@bitwarden/common/auth/abstractions/token-api.service.abstraction";
import { TokenService } from "@bitwarden/common/auth/abstractions/token.service";

@Component({
  selector: "app-verify-email",
  templateUrl: "verify-email.component.html",
})
export class VerifyEmailComponent {
  actionPromise: Promise<unknown>;

  @Output() onVerified = new EventEmitter<boolean>();

  constructor(
    private accountApiService: AccountApiService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
    private logService: LogService,
    private tokenService: TokenService,
    private tokenApiService: TokenApiService
  ) {}

  async verifyEmail(): Promise<void> {
    await this.tokenApiService.refreshAccessToken();
    if (await this.tokenService.getEmailVerified()) {
      this.onVerified.emit(true);
      this.platformUtilsService.showToast("success", null, this.i18nService.t("emailVerified"));
      return;
    }

    await this.accountApiService.postAccountVerifyEmail();
    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("checkInboxForVerification")
    );
  }

  send = async () => {
    await this.verifyEmail();
  };
}

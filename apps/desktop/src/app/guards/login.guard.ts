import { Injectable } from "@angular/core";
import { CanActivate } from "@angular/router";
import { firstValueFrom, filter, map } from "rxjs";

import { AccountService } from "@bitwarden/common/abstractions/account/account.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";

const maxAllowedAccounts = 5;

@Injectable()
export class LoginGuard implements CanActivate {
  protected homepage = "vault";
  constructor(
    private accountService: AccountService,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService
  ) {}

  async canActivate() {
    const accounts = await firstValueFrom(
      this.accountService.accounts$.pipe(
        filter((a) => a.loaded),
        map((a) => a.data)
      )
    );
    if (accounts != null && accounts.length >= maxAllowedAccounts) {
      this.platformUtilsService.showToast("error", null, this.i18nService.t("accountLimitReached"));
      return false;
    }

    return true;
  }
}

import { Component } from "@angular/core";
import { Router } from "@angular/router";

import { HintComponent as BaseHintComponent } from "@bitwarden/angular/auth/components/hint.component";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { AccountApiService } from "@bitwarden/common/auth/abstractions/account-api.service";
import { LoginService } from "@bitwarden/common/auth/abstractions/login.service";

@Component({
  selector: "app-hint",
  templateUrl: "hint.component.html",
})
export class HintComponent extends BaseHintComponent {
  constructor(
    router: Router,
    i18nService: I18nService,
    accountApiService: AccountApiService,
    platformUtilsService: PlatformUtilsService,
    logService: LogService,
    loginService: LoginService
  ) {
    super(router, i18nService, accountApiService, platformUtilsService, logService, loginService);
  }
}

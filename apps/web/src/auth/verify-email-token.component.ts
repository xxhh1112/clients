import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { first } from "rxjs/operators";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { AccountApiService } from "@bitwarden/common/auth/abstractions/account-api.service";
import { TokenApiService } from "@bitwarden/common/auth/abstractions/token-api.service.abstraction";
import { VerifyEmailRequest } from "@bitwarden/common/models/request/verify-email.request";

@Component({
  selector: "app-verify-email-token",
  templateUrl: "verify-email-token.component.html",
})
// eslint-disable-next-line rxjs-angular/prefer-takeuntil
export class VerifyEmailTokenComponent implements OnInit {
  constructor(
    private router: Router,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    private route: ActivatedRoute,
    private accountApiService: AccountApiService,
    private logService: LogService,
    private stateService: StateService,
    private tokenApiService: TokenApiService
  ) {}

  ngOnInit() {
    // eslint-disable-next-line rxjs-angular/prefer-takeuntil, rxjs/no-async-subscribe
    this.route.queryParams.pipe(first()).subscribe(async (qParams) => {
      if (qParams.userId != null && qParams.token != null) {
        try {
          await this.accountApiService.postAccountVerifyEmailToken(
            new VerifyEmailRequest(qParams.userId, qParams.token)
          );
          if (await this.stateService.getIsAuthenticated()) {
            await this.tokenApiService.refreshAccessToken();
          }
          this.platformUtilsService.showToast("success", null, this.i18nService.t("emailVerified"));
          this.router.navigate(["/"]);
          return;
        } catch (e) {
          this.logService.error(e);
        }
      }
      this.platformUtilsService.showToast("error", null, this.i18nService.t("emailVerifiedFailed"));
      this.router.navigate(["/"]);
    });
  }
}

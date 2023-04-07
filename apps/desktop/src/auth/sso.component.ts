import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { SsoComponent as BaseSsoComponent } from "@bitwarden/angular/auth/components/sso.component";
import { CryptoFunctionService } from "@bitwarden/common/abstractions/cryptoFunction.service";
import { EnvironmentService } from "@bitwarden/common/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { AccountApiService } from "@bitwarden/common/auth/abstractions/account-api.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { SsoApiService } from "@bitwarden/common/auth/abstractions/sso-api.service.abstraction";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/password";
import { SyncService } from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";

@Component({
  selector: "app-sso",
  templateUrl: "sso.component.html",
})
export class SsoComponent extends BaseSsoComponent {
  constructor(
    authService: AuthService,
    router: Router,
    i18nService: I18nService,
    syncService: SyncService,
    route: ActivatedRoute,
    stateService: StateService,
    platformUtilsService: PlatformUtilsService,
    accountApiService: AccountApiService,
    cryptoFunctionService: CryptoFunctionService,
    environmentService: EnvironmentService,
    passwordGenerationService: PasswordGenerationServiceAbstraction,
    logService: LogService,
    ssoApiService: SsoApiService
  ) {
    super(
      authService,
      router,
      i18nService,
      route,
      stateService,
      platformUtilsService,
      accountApiService,
      cryptoFunctionService,
      environmentService,
      passwordGenerationService,
      logService,
      ssoApiService
    );
    super.onSuccessfulLogin = () => {
      return syncService.fullSync(true);
    };
    this.redirectUri = "bitwarden://sso-callback";
    this.clientId = "desktop";
  }
}

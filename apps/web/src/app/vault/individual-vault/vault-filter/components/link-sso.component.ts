import { AfterContentInit, Component, Input } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { SsoComponent } from "@bitwarden/angular/auth/components/sso.component";
import { CryptoFunctionService } from "@bitwarden/common/abstractions/cryptoFunction.service";
import { EnvironmentService } from "@bitwarden/common/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { AccountApiService } from "@bitwarden/common/auth/abstractions/account-api.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { SsoApiService } from "@bitwarden/common/auth/abstractions/sso-api.service.abstraction";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/password";

@Component({
  selector: "app-link-sso",
  templateUrl: "link-sso.component.html",
})
export class LinkSsoComponent extends SsoComponent implements AfterContentInit {
  @Input() organization: Organization;
  returnUri = "/settings/organizations";

  constructor(
    platformUtilsService: PlatformUtilsService,
    i18nService: I18nService,
    accountApiService: AccountApiService,
    authService: AuthService,
    router: Router,
    route: ActivatedRoute,
    cryptoFunctionService: CryptoFunctionService,
    passwordGenerationService: PasswordGenerationServiceAbstraction,
    stateService: StateService,
    environmentService: EnvironmentService,
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

    this.returnUri = "/settings/organizations";
    this.redirectUri = window.location.origin + "/sso-connector.html";
    this.clientId = "web";
  }

  async ngAfterContentInit() {
    this.identifier = this.organization.identifier;
  }
}

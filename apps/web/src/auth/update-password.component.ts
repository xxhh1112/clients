import { Component } from "@angular/core";
import { Router } from "@angular/router";

import { UpdatePasswordComponent as BaseUpdatePasswordComponent } from "@bitwarden/angular/auth/components/update-password.component";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { AccountApiService } from "@bitwarden/common/auth/abstractions/account-api.service";
import { UserVerificationService } from "@bitwarden/common/auth/abstractions/userVerification/user-verification.service.abstraction";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/password";

@Component({
  selector: "app-update-password",
  templateUrl: "update-password.component.html",
})
export class UpdatePasswordComponent extends BaseUpdatePasswordComponent {
  constructor(
    router: Router,
    i18nService: I18nService,
    platformUtilsService: PlatformUtilsService,
    passwordGenerationService: PasswordGenerationServiceAbstraction,
    policyService: PolicyService,
    cryptoService: CryptoService,
    messagingService: MessagingService,
    accountApiService: AccountApiService,
    logService: LogService,
    stateService: StateService,
    userVerificationService: UserVerificationService
  ) {
    super(
      router,
      i18nService,
      platformUtilsService,
      passwordGenerationService,
      policyService,
      cryptoService,
      messagingService,
      accountApiService,
      stateService,
      userVerificationService,
      logService
    );
  }
}

import { Directive, OnInit } from "@angular/core";
import { Router } from "@angular/router";

import { LoginService } from "@bitwarden/common/auth/abstractions/login.service";
import { WebauthnLoginServiceAbstraction } from "@bitwarden/common/auth/abstractions/webauthn/webauthn-login.service.abstraction";
import { ForceResetPasswordReason } from "@bitwarden/common/auth/models/domain/force-reset-password-reason";
import { WebauthnAssertionView } from "@bitwarden/common/auth/models/view/webauthn/webauthn-assertion.view";
import { ErrorResponse } from "@bitwarden/common/models/response/error.response";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { ValidationService } from "@bitwarden/common/platform/abstractions/validation.service";

export type State = "assert" | "assertFailed";

@Directive()
export class BaseLoginWithWebauthnComponent implements OnInit {
  protected currentState: State = "assert";

  protected twoFactorRoute = "/2fa";
  protected successRoute = "/vault";
  protected forcePasswordResetRoute = "/update-temp-password";

  constructor(
    private webauthnService: WebauthnLoginServiceAbstraction,
    private router: Router,
    private logService: LogService,
    private validationService: ValidationService,
    private loginService: LoginService,
    private stateService: StateService
  ) {}

  ngOnInit(): void {
    this.authenticate();
  }

  protected retry() {
    this.currentState = "assert";
    this.authenticate();
  }

  private async authenticate() {
    let assertion: WebauthnAssertionView;
    try {
      const email = this.loginService.getEmail();
      const options = await this.webauthnService.getCredentialAssertionOptions(email);

      assertion = await this.webauthnService.assertCredential(options);
    } catch (error) {
      this.validationService.showError(error);
      this.currentState = "assertFailed";
      return;
    }

    try {
      // TODO: Check if [[PM-3095] [Tech Debt] Refactor post-authentication routing logic into routing strategies](https://bitwarden.atlassian.net/browse/PM-3095)
      // has been completed and if so, refactor this to use the new routing strategy.
      const authResult = await this.webauthnService.logIn(assertion);
      if (authResult.requiresTwoFactor) {
        await this.router.navigate([this.twoFactorRoute]);
      } else if (authResult.forcePasswordReset != ForceResetPasswordReason.None) {
        await this.router.navigate([this.forcePasswordResetRoute]);
      } else {
        await this.setRememberEmailValues();
        await this.router.navigate([this.successRoute]);
      }
    } catch (error) {
      if (error instanceof ErrorResponse) {
        await this.router.navigate(["/login"]);
        this.validationService.showError(error);
        return;
      }

      this.logService.error(error);
      this.currentState = "assertFailed";
    }
  }

  private async setRememberEmailValues() {
    const rememberEmail = this.loginService.getRememberEmail();
    const rememberedEmail = this.loginService.getEmail();
    await this.stateService.setRememberedEmail(rememberEmail ? rememberedEmail : null);
    this.loginService.clearValues();
  }
}

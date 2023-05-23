import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { LogService } from "@bitwarden/common/abstractions/log.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { ValidationService } from "@bitwarden/common/abstractions/validation.service";
import { LoginService } from "@bitwarden/common/auth/abstractions/login.service";
import { ForceResetPasswordReason } from "@bitwarden/common/auth/models/domain/force-reset-password-reason";
import { ErrorResponse } from "@bitwarden/common/models/response/error.response";

import { WebauthnLoginService } from "../core";
import { WebauthnAssertionView } from "../core/views/webauthn-assertion.view";
import { CreatePasskeyFailedIcon } from "../shared/icons/create-passkey-failed.icon";
import { CreatePasskeyIcon } from "../shared/icons/create-passkey.icon";

type Step = "assert" | "assertFailed";

@Component({
  selector: "app-login-with-webauthn",
  templateUrl: "login-with-webauthn.component.html",
})
export class LoginWithWebauthnComponent implements OnInit {
  protected readonly Icons = { CreatePasskeyIcon, CreatePasskeyFailedIcon };

  protected currentStep: Step = "assert";

  protected twoFactorRoute = "/2fa";
  protected successRoute = "/vault";
  protected forcePasswordResetRoute = "/update-temp-password";

  constructor(
    private webauthnService: WebauthnLoginService,
    private router: Router,
    private logService: LogService,
    private validationService: ValidationService,
    private activatedRoute: ActivatedRoute,
    private loginService: LoginService,
    private stateService: StateService
  ) {}

  ngOnInit(): void {
    this.authenticate();
  }

  protected retry() {
    this.currentStep = "assert";
    this.authenticate();
  }

  private async authenticate() {
    let assertion: WebauthnAssertionView;
    try {
      const email = this.loginService.getEmail();
      const options = await this.webauthnService.getCredentialAssertionOptions(email);

      assertion = await this.webauthnService.assertCredential(options);
    } catch (error) {
      this.currentStep = "assertFailed";
      return;
    }

    try {
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
      this.currentStep = "assertFailed";
    }
  }

  private async setRememberEmailValues() {
    const rememberEmail = this.loginService.getRememberEmail();
    const rememberedEmail = this.loginService.getEmail();
    await this.stateService.setRememberedEmail(rememberEmail ? rememberedEmail : null);
    this.loginService.clearValues();
  }
}

import { Component, OnInit } from "@angular/core";

import { WebauthnLoginService } from "../core";
import { CredentialAssertionOptionsView } from "../core/views/credential-assertion-options.view";
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
  protected options?: CredentialAssertionOptionsView;

  constructor(private webauthnService: WebauthnLoginService) {}

  ngOnInit(): void {
    this.authenticate();
  }

  protected retry() {
    this.currentStep = "assert";
    this.authenticate();
  }

  private async authenticate() {
    try {
      if (this.options === undefined) {
        this.options = await this.webauthnService.getCredentialAssertionOptions();
      }

      const assertion = await this.webauthnService.assertCredential(this.options);

      if (assertion === undefined) {
        this.currentStep = "assertFailed";
      }
    } catch {
      // TODO: Fix with better errors
      this.currentStep = "assertFailed";
    }
  }
}

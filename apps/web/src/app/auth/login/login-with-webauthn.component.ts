import { Component } from "@angular/core";

import { BaseLoginWithWebauthnComponent } from "@bitwarden/angular/auth/components/base-login-with-webauthn.component";
import { CreatePasskeyFailedIcon } from "@bitwarden/angular/auth/icons/create-passkey-failed.icon";
import { CreatePasskeyIcon } from "@bitwarden/angular/auth/icons/create-passkey.icon";

@Component({
  selector: "app-login-with-webauthn",
  templateUrl: "login-with-webauthn.component.html",
})
export class LoginWithWebauthnComponent extends BaseLoginWithWebauthnComponent {
  protected readonly Icons = { CreatePasskeyIcon, CreatePasskeyFailedIcon };
}

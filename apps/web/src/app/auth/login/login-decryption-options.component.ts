import { Component } from "@angular/core";
import { FormBuilder } from "@angular/forms";

import { BaseLoginDecryptionOptionsComponent } from "@bitwarden/angular/auth/components/base-login-decryption-options.component";

@Component({
  selector: "web-login-decryption-options",
  templateUrl: "login-decryption-options.component.html",
})
export class LoginDecryptionOptionsComponent extends BaseLoginDecryptionOptionsComponent {
  constructor(formBuilder: FormBuilder) {
    super(formBuilder);
  }
}

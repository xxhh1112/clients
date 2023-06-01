import { Component } from "@angular/core";
import { FormBuilder } from "@angular/forms";

import { BaseLoginDecryptionOptionsComponent } from "@bitwarden/angular/auth/components/base-login-decryption-options.component";
import { DevicesApiServiceAbstraction } from "@bitwarden/common/abstractions/devices/devices-api.service.abstraction";

@Component({
  selector: "browser-login-decryption-options",
  templateUrl: "login-decryption-options.component.html",
})
export class LoginDecryptionOptionsComponent extends BaseLoginDecryptionOptionsComponent {
  constructor(formBuilder: FormBuilder, devicesApiService: DevicesApiServiceAbstraction) {
    super(formBuilder, devicesApiService);
  }
}

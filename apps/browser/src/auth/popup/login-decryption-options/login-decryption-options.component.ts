import { Component } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { Router } from "@angular/router";

import { BaseLoginDecryptionOptionsComponent } from "@bitwarden/angular/auth/components/base-login-decryption-options.component";
import { DevicesServiceAbstraction } from "@bitwarden/common/abstractions/devices/devices.service.abstraction";
import { LoginService } from "@bitwarden/common/auth/abstractions/login.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { ValidationService } from "@bitwarden/common/platform/abstractions/validation.service";

@Component({
  selector: "browser-login-decryption-options",
  templateUrl: "login-decryption-options.component.html",
})
export class LoginDecryptionOptionsComponent extends BaseLoginDecryptionOptionsComponent {
  constructor(
    formBuilder: FormBuilder,
    devicesService: DevicesServiceAbstraction,
    stateService: StateService,
    router: Router,
    messagingService: MessagingService,
    loginService: LoginService,
    validationService: ValidationService
  ) {
    super(
      formBuilder,
      devicesService,
      stateService,
      router,
      messagingService,
      loginService,
      validationService
    );
  }
}

import { Component } from "@angular/core";

import { BaseLoginDecryptionOptionsComponent } from "@bitwarden/angular/auth/components/base-login-decryption-options.component";

import { BrowserApi } from "../../../platform/browser/browser-api";

@Component({
  selector: "browser-login-decryption-options",
  templateUrl: "login-decryption-options.component.html",
})
export class LoginDecryptionOptionsComponent extends BaseLoginDecryptionOptionsComponent {
  override async createUser(): Promise<void> {
    try {
      await super.createUser();
      BrowserApi.closeBitwardenExtensionTab();
    } catch (error) {
      this.validationService.showError(error);
    }
  }
}

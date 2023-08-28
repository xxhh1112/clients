import { Injectable } from "@angular/core";
import { lastValueFrom } from "rxjs";

import { UserVerificationService } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { PasswordRepromptService as PasswordRepromptServiceAbstraction } from "@bitwarden/common/vault/abstractions/password-reprompt.service";
import { DialogService } from "@bitwarden/components";

import { PasswordRepromptComponent } from "../components/password-reprompt.component";

/**
 * Used to verify the user's Master Password for the "Master Password Re-prompt" feature only.
 * See UserVerificationService for any other situation where you need to verify the user's identity.
 */
@Injectable()
export class PasswordRepromptService implements PasswordRepromptServiceAbstraction {
  constructor(
    private dialogService: DialogService,
    private userVerificationService: UserVerificationService
  ) {}

  protectedFields() {
    return ["TOTP", "Password", "H_Field", "Card Number", "Security Code"];
  }

  async showPasswordPrompt() {
    if (!(await this.enabled())) {
      return true;
    }

    const dialog = this.dialogService.open<boolean>(PasswordRepromptComponent, {
      ariaModal: true,
    });

    const result = await lastValueFrom(dialog.closed);

    return result === true;
  }

  async enabled() {
    return await this.userVerificationService.hasMasterPasswordAndMasterKeyHash();
  }
}
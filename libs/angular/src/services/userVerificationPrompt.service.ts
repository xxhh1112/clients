import { Injectable } from "@angular/core";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { KeyConnectorService } from "@bitwarden/common/abstractions/keyConnector.service";
import { UserVerificationPromptService as UserVerificationPromptServiceAbstraction } from "@bitwarden/common/abstractions/userVerificationPrompt.service";

import { UserVerificationPromptComponent } from "../components/user-verification-prompt.component";

import { ModalService } from "./modal.service";

/**
 * Used to verify the user's File Password for the "Import passwords using File Password" feature only.
 */
@Injectable()
export class UserVerificationPromptService implements UserVerificationPromptServiceAbstraction {
  protected component = UserVerificationPromptComponent;

  constructor(
    private modalService: ModalService,
    private keyConnectorService: KeyConnectorService,
    protected i18nService: I18nService
  ) {}

  protectedFields() {
    return ["TOTP", "Password", "H_Field", "Card Number", "Security Code"];
  }

  async showUserVerificationPrompt(
    confirmDescription?: string,
    confirmButtonText?: string,
    modalTitle?: string
  ) {
    if (!(await this.enabled())) {
      return true;
    }

    const ref = await this.modalService.open(this.component, {
      allowMultipleModals: true,
      data: {
        confirmDescription: confirmDescription ? confirmDescription : "passwordConfirmationDesc",
        confirmButtonText: confirmButtonText ? confirmButtonText : "ok",
        modalTitle: modalTitle ? modalTitle : "passwordConfirmation",
      },
    });

    if (ref == null) {
      return false;
    }

    return (await ref.onClosedPromise()) === true;
  }

  async enabled() {
    return !(await this.keyConnectorService.getUsesKeyConnector());
  }
}

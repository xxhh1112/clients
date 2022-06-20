import { Injectable } from "@angular/core";

import { KeyConnectorService } from "@bitwarden/common/abstractions/keyConnector.service";
import { UserSecretPromptService as UserSecretPromptServiceAbstraction } from "@bitwarden/common/abstractions/userSecretPrompt.service";

import { UserSecretPromptComponent } from "../components/user-secret-prompt.component";

import { ModalService } from "./modal.service";

/**
 * Used to verify the user's File Password for the "Import passwords using File Password" feature only.
 */
@Injectable()
export class UserSecretPromptService implements UserSecretPromptServiceAbstraction {
  protected component = UserSecretPromptComponent;

  constructor(
    private modalService: ModalService,
    private keyConnectorService: KeyConnectorService
  ) {}

  protectedFields() {
    return ["TOTP", "Password", "H_Field", "Card Number", "Security Code"];
  }

  async showPasswordPrompt(
    confirmDescription: string,
    confirmButtonText: string,
    modalTitle: string
  ) {
    if (!(await this.enabled())) {
      return true;
    }

    const ref = await this.modalService.open(this.component, {
      allowMultipleModals: true,
      data: {
        confirmDescription: confirmDescription,
        confirmButtonText: confirmButtonText,
        modalTitle: modalTitle,
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

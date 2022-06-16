import { Injectable } from "@angular/core";

import { FilePasswordPromptService as FilePasswordPromptServiceAbstraction } from "@bitwarden/common/abstractions/filePasswordPrompt.service";
import { KeyConnectorService } from "@bitwarden/common/abstractions/keyConnector.service";


import { FilePasswordPromptComponent } from "../components/file-password-prompt.component";

import { ModalService } from "./modal.service";

/**
 * Used to verify the user's File Password for the "Import passwords using File Password" feature only.
 */
@Injectable()
export class FilePasswordPromptService implements FilePasswordPromptServiceAbstraction {
  protected component = FilePasswordPromptComponent;

  constructor(
    private modalService: ModalService,
    private keyConnectorService: KeyConnectorService
  ) {}

  protectedFields() {
    return ["TOTP", "Password", "H_Field", "Card Number", "Security Code"];
  }

  async showPasswordPrompt(fcontents: string, organizationId: string) {
    if (!(await this.enabled())) {
      return true;
    }

    const ref = this.modalService.open(this.component, {
      allowMultipleModals: true,
      data: {
        fileContents: fcontents,
        organizationId: organizationId,
      },
    });

    if (ref == null) {
      return false;
    }

    const result = await ref.onClosedPromise();
    return result === true;
  }

  async enabled() {
    return !(await this.keyConnectorService.getUsesKeyConnector());
  }
}

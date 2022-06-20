import { Directive } from "@angular/core";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";

import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { ImportService } from "@bitwarden/common/abstractions/import.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { UserVerificationService } from "@bitwarden/common/abstractions/userVerification.service";

import { ModalConfig } from "../services/modal.service";

import { ModalRef } from "./modal/modal.ref";

/**
 * Used to verify the user's secret, you can customize all of the text in the modal.
 */
@Directive()
export class UserSecretPromptComponent {
  showPassword = false;
  organizationId = "";
  confirmDescription = "";
  confirmButtonText = "";
  modalTitle = "";

  myGroup = this.formBuilder.group({
    secret: new FormControl(),
  });

  constructor(
    private modalRef: ModalRef,
    private cryptoService: CryptoService,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    private importService: ImportService,
    protected config: ModalConfig,
    protected userVerificationService: UserVerificationService,
    private formBuilder: FormBuilder
  ) {
    this.confirmDescription = config.data.confirmDescription;
    this.confirmButtonText = config.data.confirmButtonText;
    this.modalTitle = config.data.modalTitle;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async submit() {
    const secret = this.myGroup.get("secret").value;

    try {
      await this.userVerificationService.verifyUser(secret);
    } catch (e) {
      this.modalRef.close(false);
      return;
    }

    this.modalRef.close(true);
  }
}

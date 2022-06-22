import { Directive } from "@angular/core";
import { FormBuilder, FormControl } from "@angular/forms";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { UserVerificationService } from "@bitwarden/common/abstractions/userVerification.service";

import { ModalConfig } from "../services/modal.service";

import { ModalRef } from "./modal/modal.ref";

/**
 * Used to verify the user's secret, you can customize all of the text in the modal.
 */
@Directive()
export class UserVerificationPromptComponent {
  showPassword = false;
  organizationId = "";
  confirmDescription = this.config.data.confirmDescription;
  confirmButtonText = this.config.data.confirmButtonText;
  modalTitle = this.config.data.modalTitle;
  myGroup = this.formBuilder.group({
    secret: new FormControl(),
  });

  constructor(
    private modalRef: ModalRef,
    protected config: ModalConfig,
    protected userVerificationService: UserVerificationService,
    private formBuilder: FormBuilder,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async submit() {
    const secret = this.myGroup.get("secret").value;

    try {
      //Incorrect secret will throw an invalid password error.
      await this.userVerificationService.verifyUser(secret);
    } catch (e) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("error"),
        this.i18nService.t("invalidMasterPassword")
      );
      return;
    }

    this.modalRef.close(true);
  }
}

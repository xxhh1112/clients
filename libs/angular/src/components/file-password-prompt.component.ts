import { Directive } from "@angular/core";
import { FormBuilder } from "@angular/forms";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { ImportService } from "@bitwarden/common/abstractions/import.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";

import { ModalConfig } from "../services/modal.service";

import { ModalRef } from "./modal/modal.ref";

/**
 * Used to verify the user's File password to import their encyrpted export file" feature only.
 */
@Directive()
export class FilePasswordPromptComponent {
  showPassword: boolean;

  importForm = this.formBuilder.group({
    filePassword: [""],
    organizationId: [""],
    fileContents: [""],
  });

  constructor(
    private modalRef: ModalRef,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    private importService: ImportService,
    config: ModalConfig,
    protected formBuilder: FormBuilder
  ) {
    this.importForm.get("fileContents").setValue(config.data.fileContents);
    this.importForm.get("organizationId").setValue(config.data.organizationId);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async submit() {
    const importerPassword = this.importService.getImporter(
      "bitwardenpasswordprotected",
      this.importForm.get("organizationId").value,
      this.importForm.get("filePassword").value
    );

    const formPromise = this.importService.import(
      importerPassword,
      this.importForm.get("fileContents").value,
      this.importForm.get("organizationId").value
    );
    const passwordError = await formPromise;

    if (passwordError != null) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("error"),
        this.i18nService.t("invalidFilePassword")
      );
    } else {
      this.modalRef.close(true);
    }
  }
}

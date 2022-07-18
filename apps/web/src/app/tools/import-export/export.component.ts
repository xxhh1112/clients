import { Component } from "@angular/core";
import { FormBuilder } from "@angular/forms";

import { ExportComponent as BaseExportComponent } from "@bitwarden/angular/components/export.component";
import { ModalConfig, ModalService } from "@bitwarden/angular/services/modal.service";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { EventService } from "@bitwarden/common/abstractions/event.service";
import { ExportService } from "@bitwarden/common/abstractions/export.service";
import { FileDownloadService } from "@bitwarden/common/abstractions/fileDownload/fileDownload.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { PolicyService } from "@bitwarden/common/abstractions/policy.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { UserVerificationService } from "@bitwarden/common/abstractions/userVerification.service";
import { EncryptedExportType } from "@bitwarden/common/enums/EncryptedExportType";

import { UserVerificationPromptComponent } from "src/app/components/user-verification-prompt.component";

@Component({
  selector: "app-export",
  templateUrl: "export.component.html",
})
export class ExportComponent extends BaseExportComponent {
  organizationId: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  confirmDescription: string;
  confirmButtonText: string;
  modalTitle: string;

  constructor(
    cryptoService: CryptoService,
    i18nService: I18nService,
    platformUtilsService: PlatformUtilsService,
    exportService: ExportService,
    eventService: EventService,
    policyService: PolicyService,
    logService: LogService,
    userVerificationService: UserVerificationService,
    modalService: ModalService,
    apiService: ApiService,
    stateService: StateService,
    modalConfig: ModalConfig,
    formBuilder: FormBuilder,
    fileDownloadService: FileDownloadService
  ) {
    super(
      cryptoService,
      i18nService,
      platformUtilsService,
      exportService,
      eventService,
      policyService,
      window,
      logService,
      userVerificationService,
      modalService,
      apiService,
      stateService,
      modalConfig,
      formBuilder,
      fileDownloadService
    );
  }

  async submit() {
    const confirmDescription =
      this.exportForm.get("fileEncryptionType").value === EncryptedExportType.FileEncrypted
        ? "confirmVaultExportDesc"
        : "encExportKeyWarningDesc";
    const confirmButtonText = "exportVault";
    const modalTitle = "confirmVaultExport";

    if (!this.validForm) {
      return;
    }

    try {
      const ref = this.modalService.open(UserVerificationPromptComponent, {
        allowMultipleModals: true,
        data: {
          confirmDescription: confirmDescription,
          confirmButtonText: confirmButtonText,
          modalTitle: modalTitle,
        },
      });

      if (ref == null) {
        return;
      }

      if (await ref.onClosedPromise()) {
        //successful
        this.submitWithSecretAlreadyVerified();
      } else {
        this.platformUtilsService.showToast(
          "error",
          this.i18nService.t("error"),
          this.i18nService.t("invalidMasterPassword")
        );
      }
    } catch {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("error"),
        this.i18nService.t("invalidMasterPassword")
      );
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    document.getElementById("newPassword").focus();
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
    document.getElementById("newConfirmPassword").focus();
  }

  protected saved() {
    super.saved();
    this.platformUtilsService.showToast("success", null, this.i18nService.t("exportSuccess"));
  }

  get validForm() {
    if (
      this.fileEncryptionType == EncryptedExportType.FileEncrypted &&
      this.format == "encrypted_json"
    ) {
      if (this.password.length > 0 || this.confirmPassword.length > 0) {
        if (this.password != this.confirmPassword) {
          this.platformUtilsService.showToast(
            "error",
            this.i18nService.t("errorOccurred"),
            this.i18nService.t("filePasswordAndConfirmFilePasswordDoNotMatch")
          );
          return false;
        }

        this.encryptionPassword = this.password;
        return true;
      }
    } else {
      this.clearPasswordField();
      return true;
    }
  }
}

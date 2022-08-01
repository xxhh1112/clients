import { Component } from "@angular/core";
import { FormBuilder } from "@angular/forms";

import { ExportComponent as BaseExportComponent } from "@bitwarden/angular/components/export.component";
import { ModalService } from "@bitwarden/angular/services/modal.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { EventService } from "@bitwarden/common/abstractions/event.service";
import { ExportService } from "@bitwarden/common/abstractions/export.service";
import { FileDownloadService } from "@bitwarden/common/abstractions/fileDownload/fileDownload.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { PolicyService } from "@bitwarden/common/abstractions/policy.service";
import { UserVerificationService } from "@bitwarden/common/abstractions/userVerification.service";
import { EncryptedExportType } from "@bitwarden/common/enums/EncryptedExportType";

import { UserVerificationPromptComponent } from "src/app/components/user-verification-prompt.component";

@Component({
  selector: "app-export",
  templateUrl: "export.component.html",
})
export class ExportComponent extends BaseExportComponent {
  organizationId: string;
  showFilePassword: boolean;
  showConfirmFilePassword: boolean;
  encryptedExportType = EncryptedExportType;

  constructor(
    cryptoService: CryptoService,
    i18nService: I18nService,
    platformUtilsService: PlatformUtilsService,
    exportService: ExportService,
    eventService: EventService,
    policyService: PolicyService,
    logService: LogService,
    userVerificationService: UserVerificationService,
    formBuilder: FormBuilder,
    fileDownloadService: FileDownloadService,
    modalService: ModalService
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
      formBuilder,
      fileDownloadService,
      modalService
    );
  }

  async submit() {
    if (!this.validForm) {
      return;
    }

    const confirmDescription =
      this.exportForm.get("fileEncryptionType").value === EncryptedExportType.FileEncrypted
        ? "FileEncryptedExportWarningDesc"
        : "encExportKeyWarningDesc";

    const ref = this.modalService.open(UserVerificationPromptComponent, {
      allowMultipleModals: true,
      data: {
        confirmDescription: confirmDescription,
        confirmButtonText: "exportVault",
        modalTitle: "confirmVaultExport",
      },
    });

    if (ref == null) {
      return;
    }

    const userVerified = await ref.onClosedPromise();
    if (userVerified) {
      //successful
      this.submitWithSecretAlreadyVerified();
    }
  }

  toggleFilePassword() {
    this.showFilePassword = !this.showFilePassword;
    document.getElementById("filePassword").focus();
  }

  toggleConfirmFilePassword() {
    this.showConfirmFilePassword = !this.showConfirmFilePassword;
    document.getElementById("confirmFilePassword").focus();
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
      if (this.filePassword.length > 0 || this.confirmFilePassword.length > 0) {
        if (this.filePassword != this.confirmFilePassword) {
          this.platformUtilsService.showToast(
            "error",
            this.i18nService.t("errorOccurred"),
            this.i18nService.t("filePasswordAndConfirmFilePasswordDoNotMatch")
          );
          return false;
        }

        return true;
      }
    } else {
      return true;
    }
  }
}

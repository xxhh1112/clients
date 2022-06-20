import { Component, EventEmitter, Output, ViewChild, ViewContainerRef } from "@angular/core";
import { FormBuilder, FormControl } from "@angular/forms";

import { ExportComponent as BaseExportComponent } from "@bitwarden/angular/components/export.component";
import { ModalConfig, ModalService } from "@bitwarden/angular/services/modal.service";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { EventService } from "@bitwarden/common/abstractions/event.service";
import { ExportService } from "@bitwarden/common/abstractions/export.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { PolicyService } from "@bitwarden/common/abstractions/policy.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { UserSecretPromptService } from "@bitwarden/common/abstractions/userSecretPrompt.service";
import { UserVerificationService } from "@bitwarden/common/abstractions/userVerification.service";

@Component({
  selector: "app-export",
  templateUrl: "export.component.html",
})
export class ExportComponent extends BaseExportComponent {
  organizationId: string;
  formatControl: string;
  encryptionType: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  secretValue: string;
  secret: FormControl;
  confirmDescription: string;
  confirmButtonText: string;
  modalTitle: string;

  @ViewChild("viewUserApiKeyModalRef", { read: ViewContainerRef, static: true })
  viewUserApiKeyModalRef: ViewContainerRef;

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
    modalService: ModalService,
    apiService: ApiService,
    stateService: StateService,
    userSecretPromptService: UserSecretPromptService,
    modalConfig: ModalConfig
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
      modalService,
      apiService,
      stateService,
      userSecretPromptService,
      modalConfig
    );
  }

  async promptUserForSecret(encryptionType: string) {
    //Default text values
    let confirmDescription = "encExportKeyWarningDesc";
    let confirmButtonText = "exportVault";
    let modalTitle = "confirmVaultExport";

    //Password encrypted export
    if (encryptionType == "2") {
      confirmDescription = "confirmVaultExportDesc";
      confirmButtonText = "exportVault";
      modalTitle = "confirmVaultExport";
    }

    const entityId = await this.stateService.getUserId();
    try {
      if (
        await this.userSecretPromptService.showPasswordPrompt(
          confirmDescription,
          confirmButtonText,
          modalTitle
        )
      ) {
        //successful
      } else {
        //failed
        this.platformUtilsService.showToast(
          "error",
          this.i18nService.t("error"),
          this.i18nService.t("invalidMasterPassword")
        );
        return;
      }

      this.submitWithSecretAlreadyVerified();
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
}

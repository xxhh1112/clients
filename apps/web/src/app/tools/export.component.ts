import { Component, EventEmitter, Output, ViewChild, ViewContainerRef } from "@angular/core";
import { FormBuilder, FormControl } from "@angular/forms";

import { ExportComponent as BaseExportComponent } from "@bitwarden/angular/components/export.component";
import { ModalService } from "@bitwarden/angular/services/modal.service";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { EventService } from "@bitwarden/common/abstractions/event.service";
import { ExportService } from "@bitwarden/common/abstractions/export.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { PolicyService } from "@bitwarden/common/abstractions/policy.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { UserVerificationService } from "@bitwarden/common/abstractions/userVerification.service";

import { ApiKeyComponent } from "../settings/api-key.component";

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
    stateService: StateService
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
      stateService
    );
  }

  async promptUserForSecret() {
    const entityId = await this.stateService.getUserId();
    try {
      // //TODO get help from Thomas on this/ other options I have to get a Secret :
      // await this.modalService.openViewRef(ApiKeyComponent, this.viewUserApiKeyModalRef, (comp) => {
      //   comp.keyType = "user";
      //   comp.entityId = entityId;
      //   comp.postKey = this.apiService.postUserApiKey.bind(this.apiService);
      //   comp.scope = "api";
      //   comp.grantType = "client_credentials";
      //   comp.apiKeyTitle = "apiKey";
      //   comp.apiKeyWarning = "userApiKeyWarning";
      //   comp.apiKeyDescription = "userApiKeyDesc";
      // });

      // this.platformUtilsService.showToast("error", "This line doesn't get called because of an error ", this.i18nService.t("exportFail"));

      //If verification is successful:
      this.submitWithSecretAlreadyVerified();
    } catch {
      this.platformUtilsService.showToast("error", "FAIL", this.i18nService.t("exportFail"));
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

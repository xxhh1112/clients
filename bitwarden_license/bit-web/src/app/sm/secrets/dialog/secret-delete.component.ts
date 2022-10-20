import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { ValidationService } from "@bitwarden/common/abstractions/validation.service";

import { SecretService } from "../secret.service";

export interface SecretDeleteOperation {
  secretIds: string[];
}

@Component({
  selector: "sm-secret-delete-dialog",
  templateUrl: "./secret-delete.component.html",
})
export class SecretDeleteDialogComponent {
  constructor(
    public dialogRef: DialogRef,
    private secretService: SecretService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
    private logService: LogService,
    private validationService: ValidationService,
    @Inject(DIALOG_DATA) public data: SecretDeleteOperation
  ) {}

  get title() {
    return this.data.secretIds.length === 1 ? "deleteSecret" : "deleteSecrets";
  }

  async delete() {
    try {
      await this.secretService.delete(this.data.secretIds);
      this.dialogRef.close();
      const message =
        this.data.secretIds.length === 1 ? "softDeleteSuccessToast" : "softDeletesSuccessToast";
      this.platformUtilsService.showToast("success", null, this.i18nService.t(message));
    } catch (e) {
      this.logService.error(e);
      this.validationService.showError(e);
    }
  }
}

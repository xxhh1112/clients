import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";

import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";

export interface BulkRestoreDialogParams {
  cipherIds: string[];
}

export enum BulkRestoreDialogResult {
  Restored = "restored",
  Canceled = "canceled",
}

@Component({
  selector: "app-vault-bulk-restore",
  templateUrl: "bulk-restore-dialog.component.html",
})
export class BulkRestoreDialogComponent {
  cipherIds: string[];

  formPromise: Promise<any>;

  constructor(
    @Inject(DIALOG_DATA) params: BulkRestoreDialogParams,
    private dialogRef: DialogRef<BulkRestoreDialogResult>,
    private cipherService: CipherService,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService
  ) {
    this.cipherIds = params.cipherIds ?? [];
  }

  submit = async () => {
    this.formPromise = this.cipherService.restoreManyWithServer(this.cipherIds);
    await this.formPromise;
    this.platformUtilsService.showToast("success", null, this.i18nService.t("restoredItems"));
    this.close(BulkRestoreDialogResult.Restored);
  };

  protected cancel() {
    this.close(BulkRestoreDialogResult.Canceled);
  }

  private close(result: BulkRestoreDialogResult) {
    this.dialogRef.close(result);
  }
}

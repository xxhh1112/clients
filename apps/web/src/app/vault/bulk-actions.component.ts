import { Component, Input } from "@angular/core";
import { lastValueFrom } from "rxjs";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PasswordRepromptService } from "@bitwarden/common/abstractions/passwordReprompt.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { CipherRepromptType } from "@bitwarden/common/enums/cipherRepromptType";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { DialogService } from "@bitwarden/components";

import {
  BulkDeleteDialogResult,
  openBulkDeleteDialog,
} from "./bulk-action-dialogs/bulk-delete-dialog/bulk-delete-dialog.component";
import {
  BulkMoveDialogResult,
  openBulkMoveDialog,
} from "./bulk-action-dialogs/bulk-move-dialog/bulk-move-dialog.component";
import {
  BulkRestoreDialogResult,
  openBulkRestoreDialog,
} from "./bulk-action-dialogs/bulk-restore-dialog/bulk-restore-dialog.component";
import {
  BulkShareDialogResult,
  openBulkShareDialog,
} from "./bulk-action-dialogs/bulk-share-dialog/bulk-share-dialog.component";
import { VaultItemsComponent } from "./vault-items.component";

@Component({
  selector: "app-vault-bulk-actions",
  templateUrl: "bulk-actions.component.html",
})
// eslint-disable-next-line rxjs-angular/prefer-takeuntil
export class BulkActionsComponent {
  @Input() vaultItemsComponent: VaultItemsComponent;
  @Input() deleted: boolean;
  @Input() organization: Organization;

  constructor(
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    private dialogService: DialogService,
    private passwordRepromptService: PasswordRepromptService
  ) {}

  async bulkDelete() {
    if (!(await this.promptPassword())) {
      return;
    }

    const selectedCipherIds = this.vaultItemsComponent.selectedCipherIds;
    if (selectedCipherIds.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("nothingSelected")
      );
      return;
    }

    const dialog = openBulkDeleteDialog(this.dialogService, {
      data: {
        permanent: this.deleted,
        cipherIds: selectedCipherIds,
        organization: this.organization,
      },
    });

    const result = await lastValueFrom(dialog.closed);
    if (result === BulkDeleteDialogResult.Deleted) {
      await this.vaultItemsComponent.refresh();
    }
  }

  async bulkRestore() {
    if (!(await this.promptPassword())) {
      return;
    }

    const selectedCipherIds = this.vaultItemsComponent.selectedCipherIds;
    if (selectedCipherIds.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("nothingSelected")
      );
      return;
    }

    const dialog = openBulkRestoreDialog(this.dialogService, {
      data: {
        cipherIds: selectedCipherIds,
      },
    });

    const result = await lastValueFrom(dialog.closed);
    if (result === BulkRestoreDialogResult.Restored) {
      this.vaultItemsComponent.refresh();
    }
  }

  async bulkShare() {
    if (!(await this.promptPassword())) {
      return;
    }

    const selectedCiphers = this.vaultItemsComponent.selectedCiphers;
    if (selectedCiphers.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("nothingSelected")
      );
      return;
    }

    const dialog = openBulkShareDialog(this.dialogService, { data: { ciphers: selectedCiphers } });

    const result = await lastValueFrom(dialog.closed);
    if (result === BulkShareDialogResult.Shared) {
      this.vaultItemsComponent.refresh();
    }
  }

  async bulkMove() {
    if (!(await this.promptPassword())) {
      return;
    }

    const selectedCipherIds = this.vaultItemsComponent.selectedCipherIds;
    if (selectedCipherIds.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("nothingSelected")
      );
      return;
    }

    const dialog = openBulkMoveDialog(this.dialogService, {
      data: { cipherIds: selectedCipherIds },
    });

    const result = await lastValueFrom(dialog.closed);
    if (result === BulkMoveDialogResult.Moved) {
      this.vaultItemsComponent.refresh();
    }
  }

  selectAll(select: boolean) {
    this.vaultItemsComponent.checkAll(select);
  }

  private async promptPassword() {
    const selectedCiphers = this.vaultItemsComponent.selectedCiphers;
    const notProtected = !selectedCiphers.find(
      (cipher) => cipher.reprompt !== CipherRepromptType.None
    );

    return notProtected || (await this.passwordRepromptService.showPasswordPrompt());
  }
}

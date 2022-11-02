import { Component, Input, ViewChild, ViewContainerRef } from "@angular/core";
import { lastValueFrom } from "rxjs";

import { ModalService } from "@bitwarden/angular/services/modal.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PasswordRepromptService } from "@bitwarden/common/abstractions/passwordReprompt.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { CipherRepromptType } from "@bitwarden/common/enums/cipherRepromptType";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { DialogService } from "@bitwarden/components";

import { BulkDeleteDialogResult, openBulkDeleteDialog } from "./bulk-delete-dialog.component";
import {
  BulkMoveDialogComponent,
  BulkMoveDialogParams,
  BulkMoveDialogResult,
} from "./bulk-move-dialog.component";
import {
  BulkRestoreDialogComponent,
  BulkRestoreDialogParams,
  BulkRestoreDialogResult,
} from "./bulk-restore-dialog.component";
import {
  BulkShareDialogComponent,
  BulkShareDialogParams,
  BulkShareDialogResult,
} from "./bulk-share-dialog.component";
import { CiphersComponent } from "./ciphers.component";

@Component({
  selector: "app-vault-bulk-actions",
  templateUrl: "bulk-actions.component.html",
})
// eslint-disable-next-line rxjs-angular/prefer-takeuntil
export class BulkActionsComponent {
  @Input() ciphersComponent: CiphersComponent;
  @Input() deleted: boolean;
  @Input() organization: Organization;

  @ViewChild("bulkDeleteTemplate", { read: ViewContainerRef, static: true })
  bulkDeleteModalRef: ViewContainerRef;
  @ViewChild("bulkRestoreTemplate", { read: ViewContainerRef, static: true })
  bulkRestoreModalRef: ViewContainerRef;
  @ViewChild("bulkMoveTemplate", { read: ViewContainerRef, static: true })
  bulkMoveModalRef: ViewContainerRef;
  @ViewChild("bulkShareTemplate", { read: ViewContainerRef, static: true })
  bulkShareModalRef: ViewContainerRef;

  constructor(
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    private dialogService: DialogService,
    private modalService: ModalService,
    private passwordRepromptService: PasswordRepromptService
  ) {}

  async bulkDelete() {
    if (!(await this.promptPassword())) {
      return;
    }

    const selectedCipherIds = this.ciphersComponent.selectedCipherIds;
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

    const result = (await lastValueFrom(dialog.closed)) as BulkDeleteDialogResult | undefined;
    if (result === BulkDeleteDialogResult.Deleted) {
      await this.ciphersComponent.refresh();
    }
  }

  async bulkRestore() {
    if (!(await this.promptPassword())) {
      return;
    }

    const selectedCipherIds = this.ciphersComponent.selectedCipherIds;
    if (selectedCipherIds.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("nothingSelected")
      );
      return;
    }

    const bulkRestoreParams: BulkRestoreDialogParams = {
      cipherIds: selectedCipherIds,
    };

    const dialog = this.dialogService.open(BulkRestoreDialogComponent, {
      data: bulkRestoreParams,
    });

    const result = (await lastValueFrom(dialog.closed)) as BulkRestoreDialogResult | undefined;
    if (result === BulkRestoreDialogResult.Restored) {
      this.ciphersComponent.refresh();
    }
  }

  async bulkShare() {
    if (!(await this.promptPassword())) {
      return;
    }

    const selectedCiphers = this.ciphersComponent.selectedCiphers;
    if (selectedCiphers.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("nothingSelected")
      );
      return;
    }

    const bulkShareParams: BulkShareDialogParams = {
      ciphers: selectedCiphers,
    };

    const dialog = this.dialogService.open(BulkShareDialogComponent, {
      data: bulkShareParams,
    });

    const result = (await lastValueFrom(dialog.closed)) as BulkShareDialogResult | undefined;
    if (result === BulkShareDialogResult.Shared) {
      this.ciphersComponent.refresh();
    }
  }

  async bulkMove() {
    if (!(await this.promptPassword())) {
      return;
    }

    const selectedCipherIds = this.ciphersComponent.selectedCipherIds;
    if (selectedCipherIds.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("nothingSelected")
      );
      return;
    }

    const bulkMoveParams: BulkMoveDialogParams = {
      cipherIds: selectedCipherIds,
    };

    const dialog = this.dialogService.open(BulkMoveDialogComponent, {
      data: bulkMoveParams,
    });

    const result = (await lastValueFrom(dialog.closed)) as BulkMoveDialogResult | undefined;
    if (result === BulkMoveDialogResult.Moved) {
      this.ciphersComponent.refresh();
    }
  }

  selectAll(select: boolean) {
    this.ciphersComponent.checkAll(select);
  }

  private async promptPassword() {
    const selectedCiphers = this.ciphersComponent.selectedCiphers;
    const notProtected = !selectedCiphers.find(
      (cipher) => cipher.reprompt !== CipherRepromptType.None
    );

    return notProtected || (await this.passwordRepromptService.showPasswordPrompt());
  }
}

import { DialogConfig } from "@angular/cdk/dialog";
import { Component } from "@angular/core";

import { DialogService } from "@bitwarden/components";

export enum CreateCredentialDialogResult {
  Success,
  Canceled,
}

@Component({
  templateUrl: "create-credential-dialog.component.html",
})
export class CreateCredentialDialogComponent {}

/**
 * Strongly typed helper to open a CreateCredentialDialog
 * @param dialogService Instance of the dialog service that will be used to open the dialog
 * @param config Configuration for the dialog
 */
export const openCreateCredentialDialog = (
  dialogService: DialogService,
  config: DialogConfig<unknown>
) => {
  return dialogService.open<CreateCredentialDialogResult, unknown>(
    CreateCredentialDialogComponent,
    config
  );
};

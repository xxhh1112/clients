import { Component } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { DialogServiceAbstraction } from "@bitwarden/angular/services/dialog";

import {
  CreateCredentialDialogResult,
  openCreateCredentialDialog,
} from "./create-credential-dialog/create-credential-dialog.component";

@Component({
  selector: "app-fido2-login-settings",
  templateUrl: "fido2-login-settings.component.html",
})
export class Fido2LoginSettingsComponent {
  constructor(private dialogService: DialogServiceAbstraction) {}

  protected async createCredential() {
    const dialogRef = openCreateCredentialDialog(this.dialogService, {});

    const result = await firstValueFrom(dialogRef.closed);

    if (result === CreateCredentialDialogResult.Success) {
      /** Refresh */
    }
  }
}

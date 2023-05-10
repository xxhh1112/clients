import { Component, OnInit } from "@angular/core";
import { firstValueFrom, Observable } from "rxjs";

import { DialogServiceAbstraction } from "@bitwarden/angular/services/dialog";

import { WebauthnService } from "../../core";
import { WebauthnCredentialView } from "../../core/views/webauth-credential.view";

import {
  CreateCredentialDialogResult,
  openCreateCredentialDialog,
} from "./create-credential-dialog/create-credential-dialog.component";

@Component({
  selector: "app-fido2-login-settings",
  templateUrl: "fido2-login-settings.component.html",
})
export class Fido2LoginSettingsComponent implements OnInit {
  protected credentials$: Observable<WebauthnCredentialView[]>;

  constructor(
    private webauthnService: WebauthnService,
    private dialogService: DialogServiceAbstraction
  ) {}

  ngOnInit(): void {
    this.credentials$ = this.webauthnService.getCredentials$();
  }

  protected async createCredential() {
    const dialogRef = openCreateCredentialDialog(this.dialogService, {});

    const result = await firstValueFrom(dialogRef.closed);

    if (result === CreateCredentialDialogResult.Success) {
      /** Refresh */
    }
  }
}

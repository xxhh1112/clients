import { DialogConfig, DialogRef } from "@angular/cdk/dialog";
import { Component } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

import { DialogServiceAbstraction } from "@bitwarden/angular/services/dialog";
import { VerificationType } from "@bitwarden/common/auth/enums/verification-type";

import { WebauthnService } from "../../../core";
import { NewCredentialOptionsView } from "../../../core/views/new-credential-options.view";

import { CreatePasskeyFailedIcon } from "./create-passkey-failed.icon";
import { CreatePasskeyIcon } from "./create-passkey.icon";

export enum CreateCredentialDialogResult {
  Success,
  Canceled,
}

type Step =
  | "userVerification"
  | "credentialCreation"
  | "credentialCreationFailed"
  | "credentialNaming";

@Component({
  templateUrl: "create-credential-dialog.component.html",
})
export class CreateCredentialDialogComponent {
  protected readonly CreateCredentialDialogResult = CreateCredentialDialogResult;
  protected readonly Icons = { CreatePasskeyIcon, CreatePasskeyFailedIcon };

  protected currentStep: Step = "userVerification";
  protected formGroup = this.formBuilder.group({
    userVerification: this.formBuilder.group({
      masterPassword: ["", [Validators.required]],
    }),
    credentialNaming: this.formBuilder.group({
      name: ["", Validators.maxLength(50)],
    }),
  });
  protected credentialOptions?: NewCredentialOptionsView;

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: DialogRef,
    private webauthnService: WebauthnService
  ) {}

  protected submit = async () => {
    this.dialogRef.disableClose = true;

    try {
      if (this.currentStep === "userVerification") {
        this.formGroup.controls.userVerification.markAllAsTouched();
        if (this.formGroup.controls.userVerification.invalid) {
          return;
        }

        this.credentialOptions = await this.webauthnService.getNewCredentialOptions({
          type: VerificationType.MasterPassword,
          secret: this.formGroup.value.userVerification.masterPassword,
        });
        if (this.credentialOptions === undefined) {
          return;
        }
        this.currentStep = "credentialCreation";
      }

      if (this.currentStep === "credentialCreationFailed") {
        this.currentStep = "credentialCreation";
      }

      if (this.currentStep === "credentialCreation") {
        const credential = await this.webauthnService.createCredential(this.credentialOptions);
        if (credential === undefined) {
          this.currentStep = "credentialCreationFailed";
          return;
        }
      }
    } finally {
      this.dialogRef.disableClose = false;
    }
  };
}

/**
 * Strongly typed helper to open a CreateCredentialDialog
 * @param dialogService Instance of the dialog service that will be used to open the dialog
 * @param config Configuration for the dialog
 */
export const openCreateCredentialDialog = (
  dialogService: DialogServiceAbstraction,
  config: DialogConfig<unknown>
) => {
  return dialogService.open<CreateCredentialDialogResult, unknown>(
    CreateCredentialDialogComponent,
    config
  );
};

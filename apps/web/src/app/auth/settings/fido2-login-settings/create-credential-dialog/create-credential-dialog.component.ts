import { DialogConfig, DialogRef } from "@angular/cdk/dialog";
import { Component } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

import { DialogServiceAbstraction } from "@bitwarden/angular/services/dialog";

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

  constructor(private formBuilder: FormBuilder, private dialogRef: DialogRef) {}

  protected submit = async () => {
    this.dialogRef.disableClose = true;

    try {
      if (this.currentStep === "userVerification") {
        this.formGroup.controls.userVerification.markAllAsTouched();
        if (this.formGroup.controls.userVerification.invalid) {
          return;
        }
        await this.verifyUser();
        this.currentStep = "credentialCreation";
      }

      if (this.currentStep === "credentialCreationFailed") {
        this.currentStep = "credentialCreation";
      }

      if (this.currentStep === "credentialCreation") {
        try {
          await this.createCredential();
        } catch {
          this.currentStep = "credentialCreationFailed";
        }
      }
    } finally {
      this.dialogRef.disableClose = false;
    }
  };

  private async verifyUser() {
    // Mocked
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private async createCredential() {
    await new Promise((_, reject) => setTimeout(() => reject(new Error("Not implemented")), 1000));
  }
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

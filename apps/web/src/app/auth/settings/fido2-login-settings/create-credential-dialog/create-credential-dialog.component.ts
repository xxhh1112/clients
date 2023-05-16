import { DialogConfig, DialogRef } from "@angular/cdk/dialog";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { map, Observable } from "rxjs";

import { DialogServiceAbstraction } from "@bitwarden/angular/services/dialog";
import { VerificationType } from "@bitwarden/common/auth/enums/verification-type";

import { WebauthnService } from "../../../core";
import { CredentialCreateOptionsView } from "../../../core/views/credential-create-options.view";

import { CreatePasskeyFailedIcon } from "./create-passkey-failed.icon";
import { CreatePasskeyIcon } from "./create-passkey.icon";

export enum CreateCredentialDialogResult {
  Success,
}

type Step =
  | "userVerification"
  | "credentialCreation"
  | "credentialCreationFailed"
  | "credentialNaming";

@Component({
  templateUrl: "create-credential-dialog.component.html",
})
export class CreateCredentialDialogComponent implements OnInit {
  protected readonly NameMaxCharacters = 50;
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
  protected credentialOptions?: CredentialCreateOptionsView;
  protected deviceResponse?: PublicKeyCredential;
  protected hasPasskeys$?: Observable<boolean>;

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: DialogRef,
    private webauthnService: WebauthnService
  ) {}

  ngOnInit(): void {
    this.hasPasskeys$ = this.webauthnService.credentials$.pipe(
      map((credentials) => credentials.length > 0)
    );
  }

  protected submit = async () => {
    this.dialogRef.disableClose = true;

    try {
      switch (this.currentStep) {
        case "userVerification":
          return await this.submitUserVerification();
        case "credentialCreationFailed":
          return await this.submitCredentialCreationFailed();
        case "credentialCreation":
          return await this.submitCredentialCreation();
        case "credentialNaming":
          return await this.submitCredentialNaming();
      }
    } finally {
      this.dialogRef.disableClose = false;
    }
  };

  protected async submitUserVerification() {
    this.formGroup.controls.userVerification.markAllAsTouched();
    if (this.formGroup.controls.userVerification.invalid) {
      return;
    }

    this.credentialOptions = await this.webauthnService.getCredentialCreateOptions({
      type: VerificationType.MasterPassword,
      secret: this.formGroup.value.userVerification.masterPassword,
    });

    if (this.credentialOptions === undefined) {
      return;
    }

    this.currentStep = "credentialCreation";
    await this.submitCredentialCreation();
  }

  protected async submitCredentialCreation() {
    this.deviceResponse = await this.webauthnService.createCredential(this.credentialOptions);
    if (this.deviceResponse === undefined) {
      this.currentStep = "credentialCreationFailed";
      return;
    }

    this.currentStep = "credentialNaming";
  }

  protected async submitCredentialCreationFailed() {
    this.currentStep = "credentialCreation";
    await this.submitCredentialCreation();
  }

  protected async submitCredentialNaming() {
    this.formGroup.controls.credentialNaming.markAllAsTouched();
    if (this.formGroup.controls.credentialNaming.invalid) {
      return;
    }

    const result = await this.webauthnService.saveCredential(
      this.credentialOptions,
      this.deviceResponse,
      this.formGroup.value.credentialNaming.name
    );

    if (!result) {
      return;
    }

    this.dialogRef.close(CreateCredentialDialogResult.Success);
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
  return dialogService.open<CreateCredentialDialogResult | undefined, unknown>(
    CreateCredentialDialogComponent,
    config
  );
};

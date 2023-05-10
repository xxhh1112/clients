import { DialogConfig, DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";

import { DialogServiceAbstraction } from "@bitwarden/angular/services/dialog";

import { WebauthnService } from "../../../core";
import { WebauthnCredentialView } from "../../../core/views/webauth-credential.view";

export interface DeleteCredentialDialogParams {
  credentialId: string;
}

@Component({
  templateUrl: "delete-credential-dialog.component.html",
})
export class DeleteCredentialDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  protected formGroup = this.formBuilder.group({
    masterPassword: ["", [Validators.required]],
  });
  protected credential?: WebauthnCredentialView;

  constructor(
    @Inject(DIALOG_DATA) private params: DeleteCredentialDialogParams,
    private formBuilder: FormBuilder,
    private dialogRef: DialogRef,
    private webauthnService: WebauthnService
  ) {}

  ngOnInit(): void {
    this.webauthnService
      .getCredential$(this.params.credentialId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((credential) => (this.credential = credential));
  }

  submit = async () => {
    // empty
  };

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

/**
 * Strongly typed helper to open a DeleteCredentialDialogComponent
 * @param dialogService Instance of the dialog service that will be used to open the dialog
 * @param config Configuration for the dialog
 */
export const openDeleteCredentialDialogComponent = (
  dialogService: DialogServiceAbstraction,
  config: DialogConfig<DeleteCredentialDialogParams>
) => {
  return dialogService.open<unknown>(DeleteCredentialDialogComponent, config);
};

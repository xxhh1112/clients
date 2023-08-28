import { DialogRef } from "@angular/cdk/dialog";
import { Component } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import {
  AsyncActionsModule,
  ButtonModule,
  DialogModule,
  FormFieldModule,
  IconButtonModule,
} from "@bitwarden/components";

/**
 * Used to verify the user's Master Password for the "Master Password Re-prompt" feature only.
 * See UserVerificationComponent for any other situation where you need to verify the user's identity.
 */
@Component({
  standalone: true,
  selector: "app-password-reprompt",
  imports: [
    JslibModule,
    AsyncActionsModule,
    ButtonModule,
    DialogModule,
    FormFieldModule,
    IconButtonModule,
    ReactiveFormsModule,
  ],
  templateUrl: "password-reprompt.component.html",
})
export class PasswordRepromptComponent {
  showPassword = false;

  formGroup = this.formBuilder.group({
    masterPassword: ["", [Validators.required]],
  });

  constructor(
    protected cryptoService: CryptoService,
    protected platformUtilsService: PlatformUtilsService,
    protected i18nService: I18nService,
    protected formBuilder: FormBuilder,
    protected dialogRef: DialogRef
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  submit = async () => {
    if (
      !(await this.cryptoService.compareAndUpdateKeyHash(this.formGroup.value.masterPassword, null))
    ) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("invalidMasterPassword")
      );
      return;
    }

    this.dialogRef.close(true);
  };
}

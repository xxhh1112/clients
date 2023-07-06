import { Component } from "@angular/core";

import { PasswordRepromptComponent as BasePasswordRepromptComponent } from "@bitwarden/angular/vault/components/password-reprompt.component";

@Component({
  templateUrl: "password-reprompt.component.html",
})
export class PasswordRepromptComponent extends BasePasswordRepromptComponent {
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

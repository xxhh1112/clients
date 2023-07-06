import { DialogRef } from "@angular/cdk/dialog";
import { Directive, Optional } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { ModalRef } from "../../components/modal/modal.ref";

/**
 * Used to verify the user's Master Password for the "Master Password Re-prompt" feature only.
 * See UserVerificationComponent for any other situation where you need to verify the user's identity.
 */
@Directive()
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
    //These are optional because they are not used differently in each client
    //and should be removed from the base class once the clients use the CL.
    @Optional() protected dialogRef: DialogRef,
    @Optional() protected modalRef: ModalRef
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

    this.modalRef.close(true);
  };
}

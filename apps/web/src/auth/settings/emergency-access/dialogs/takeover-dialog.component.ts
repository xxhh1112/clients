import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

import { ChangePasswordComponent } from "@bitwarden/angular/auth/components/change-password.component";
import { InputsFieldMatch } from "@bitwarden/angular/validators/inputsFieldMatch.validator";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { MessagingService } from "@bitwarden/common/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/password";

import { EmergencyAccessService } from "../emergency-access.service";

export type TakeoverData = {
  id: string;

  name: string;
  email: string;
};

@Component({
  templateUrl: "takeover-dialog.component.html",
})
export class TakeoverDialogComponent extends ChangePasswordComponent implements OnInit, OnDestroy {
  private emergencyAccessId: string;

  protected name: string;
  protected email: string;
  protected showPassword = false;

  protected formGroup = this.formBuilder.group(
    {
      masterPassword: ["", [Validators.required, Validators.minLength(this.minimumLength)]],
      confirmMasterPassword: ["", [Validators.required, Validators.minLength(this.minimumLength)]],
    },
    {
      validator: InputsFieldMatch.validateFormInputsMatch(
        "masterPassword",
        "confirmMasterPassword",
        this.i18nService.t("masterPassDoesntMatch")
      ),
    }
  );

  constructor(
    @Inject(DIALOG_DATA) private data: any,
    private dialogRef: DialogRef,
    i18nService: I18nService,
    cryptoService: CryptoService,
    messagingService: MessagingService,
    stateService: StateService,
    passwordGenerationService: PasswordGenerationServiceAbstraction,
    platformUtilsService: PlatformUtilsService,
    policyService: PolicyService,
    private formBuilder: FormBuilder,
    private emergencyAccessService: EmergencyAccessService
  ) {
    super(
      i18nService,
      cryptoService,
      messagingService,
      passwordGenerationService,
      platformUtilsService,
      policyService,
      stateService
    );
  }

  async ngOnInit() {
    this.emergencyAccessId = this.data.id;
    this.name = this.data.name;
    this.email = this.data.email;

    this.enforcedPolicyOptions = await this.emergencyAccessService.getPasswordPolicies(
      this.emergencyAccessId
    );
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  submit = async () => {
    if (!(await this.strongPassword())) {
      return;
    }

    this.emergencyAccessService.takeover(
      this.emergencyAccessId,
      this.formGroup.value.masterPassword,
      this.email
    );

    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("passwordResetFor", this.name)
    );

    this.dialogRef.close();
  };
}

import { DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, EventEmitter, Inject } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { UserVerificationService } from "@bitwarden/common/abstractions/userVerification/userVerification.service.abstraction";
import { TwoFactorProviderType } from "@bitwarden/common/auth/enums/two-factor-provider-type";
import { TwoFactorEmailRequest } from "@bitwarden/common/auth/models/request/two-factor-email.request";
import { UpdateTwoFactorEmailRequest } from "@bitwarden/common/auth/models/request/update-two-factor-email.request";
import { TwoFactorEmailResponse } from "@bitwarden/common/auth/models/response/two-factor-email.response";
import { Utils } from "@bitwarden/common/misc/utils";
import { Verification } from "@bitwarden/common/types/verification";

import { TwoFactorSettingsService } from "./two-factor-settings.service";

export interface TwoFactorEmailOptions {
  updated: EventEmitter<boolean>;
}

@Component({
  selector: "app-two-factor-email",
  templateUrl: "two-factor-email.component.html",
})
export class EmailDialogComponent {
  protected sentEmail: string;
  protected enabled: boolean;
  protected secret: Verification;

  protected authed = false;

  protected formGroup = this.formBuilder.group({
    email: ["", Validators.required],
    token: ["", Validators.required],
  });

  constructor(
    @Inject(DIALOG_DATA) private data: TwoFactorEmailOptions,
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private userVerificationService: UserVerificationService,
    private stateService: StateService,
    private twoFactorSettingsService: TwoFactorSettingsService
  ) {}

  protected submit = async () => {
    // First step is to auth
    if (!this.authed) {
      return this.auth();
    }

    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) {
      return;
    }

    const request = await this.userVerificationService.buildRequest(
      this.secret,
      UpdateTwoFactorEmailRequest
    );

    request.email = this.formGroup.value.email;
    request.token = this.formGroup.value.token;

    const response = await this.apiService.putTwoFactorEmail(request);

    await this.processResponse(response);

    this.data.updated.emit(this.enabled);
  };

  protected sendEmail = async () => {
    const email = this.formGroup.value.email;

    const request = await this.userVerificationService.buildRequest(
      this.secret,
      TwoFactorEmailRequest
    );
    request.email = email;
    await this.apiService.postTwoFactorEmailSetup(request);

    this.sentEmail = email;
  };

  protected async auth() {
    const request = await this.userVerificationService.buildRequest(this.secret);
    const response = await this.apiService.getTwoFactorEmail(request);

    await this.processResponse(response);

    this.authed = true;
  }

  protected disable = async () => {
    this.enabled = await this.twoFactorSettingsService.disable(
      this.secret,
      TwoFactorProviderType.Email
    );

    this.data.updated.emit(this.enabled);
  };

  private async processResponse(response: TwoFactorEmailResponse) {
    this.formGroup.patchValue({ email: response.email });
    this.enabled = response.enabled;

    // Fallback to current user email
    if (!response.enabled && Utils.isNullOrEmpty(this.formGroup.value.email)) {
      this.formGroup.patchValue({ email: await this.stateService.getEmail() });
    }
  }
}

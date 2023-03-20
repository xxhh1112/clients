import { DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, EventEmitter, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { UserVerificationService } from "@bitwarden/common/abstractions/userVerification/userVerification.service.abstraction";
import { TwoFactorProviderType } from "@bitwarden/common/auth/enums/two-factor-provider-type";
import { UpdateTwoFactorAuthenticatorRequest } from "@bitwarden/common/auth/models/request/update-two-factor-authenticator.request";
import { TwoFactorAuthenticatorResponse } from "@bitwarden/common/auth/models/response/two-factor-authenticator.response";
import { Utils } from "@bitwarden/common/misc/utils";
import { Verification } from "@bitwarden/common/types/verification";

import { TwoFactorSettingsService } from "./two-factor-settings.service";

// NOTE: There are additional options available but these are just the ones we are current using.
// See: https://github.com/neocotic/qrious#examples
interface QRiousOptions {
  element: HTMLElement;
  value: string;
  size: number;
}

declare global {
  interface Window {
    QRious: new (options: QRiousOptions) => unknown;
  }
}

export interface TwoFactorAuthenticatorOptions {
  updated: EventEmitter<boolean>;
}

@Component({
  selector: "app-two-factor-authenticator",
  templateUrl: "two-factor-authenticator.component.html",
})
export class AuthenticatorDialogComponent implements OnInit, OnDestroy {
  protected secret: Verification;
  protected authed = false;

  protected enabled: boolean;
  protected key = "";

  protected formGroup = this.formBuilder.group({
    token: ["", Validators.required],
  });

  private qrScript: HTMLScriptElement;

  constructor(
    @Inject(DIALOG_DATA) private data: TwoFactorAuthenticatorOptions,
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private userVerificationService: UserVerificationService,
    private stateService: StateService,
    private twoFactorSettingsService: TwoFactorSettingsService
  ) {
    this.qrScript = window.document.createElement("script");
    this.qrScript.src = "scripts/qrious.min.js";
    this.qrScript.async = true;
  }

  ngOnInit() {
    window.document.body.appendChild(this.qrScript);
  }

  ngOnDestroy() {
    window.document.body.removeChild(this.qrScript);
  }

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
      UpdateTwoFactorAuthenticatorRequest
    );

    request.token = this.formGroup.value.token;
    request.key = this.key;

    const response = await this.apiService.putTwoFactorAuthenticator(request);
    await this.processResponse(response);

    this.data.updated.emit(this.enabled);
  };

  protected async auth() {
    const request = await this.userVerificationService.buildRequest(this.secret);
    const response = await this.apiService.getTwoFactorAuthenticator(request);

    await this.processResponse(response);

    this.authed = true;
  }

  protected disable = async () => {
    this.enabled = await this.twoFactorSettingsService.disable(
      this.secret,
      TwoFactorProviderType.Authenticator
    );
    this.data.updated.emit(this.enabled);
  };

  private async processResponse(response: TwoFactorAuthenticatorResponse) {
    this.key = response.key;
    this.enabled = response.enabled;

    const email = await this.stateService.getEmail();
    window.setTimeout(() => {
      new window.QRious({
        element: document.getElementById("qr"),
        value:
          "otpauth://totp/Bitwarden:" +
          Utils.encodeRFC3986URIComponent(email) +
          "?secret=" +
          encodeURIComponent(this.key) +
          "&issuer=Bitwarden",
        size: 160,
      });
    }, 100);
  }
}

import { Directive, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { Router } from "@angular/router";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { AuthService } from "@bitwarden/common/abstractions/auth.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { EnvironmentService } from "@bitwarden/common/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PasswordGenerationService } from "@bitwarden/common/abstractions/passwordGeneration.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { DEFAULT_KDF_ITERATIONS, DEFAULT_KDF_TYPE } from "@bitwarden/common/enums/kdfType";
import { KeysRequest } from "@bitwarden/common/models/request/keysRequest";
import { ReferenceEventRequest } from "@bitwarden/common/models/request/referenceEventRequest";
import { RegisterRequest } from "@bitwarden/common/models/request/registerRequest";

import { CaptchaProtectedComponent } from "./captchaProtected.component";

@Directive()
export class RegisterComponent extends CaptchaProtectedComponent implements OnInit {
  @ViewChild("masterPassword") masterPasswordRef: ElementRef;
  @ViewChild("masterPasswordRetype") masterPasswordRetypeRef: ElementRef;
  name = "";
  email = "";
  masterPassword = "";
  confirmMasterPassword = "";
  hint = "";
  showPassword = false;
  formPromise: Promise<any>;
  masterPasswordScore: number;
  referenceData: ReferenceEventRequest;
  showTerms = true;
  acceptPolicies = false;

  formGroup = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
    name: [""],
    masterPassword: ["", [Validators.required]],
    confirmMasterPassword: ["", [Validators.required]],
    hint: [],
    acceptPolicies: [false, [Validators.requiredTrue]],
  });

  protected successRoute = "login";
  private masterPasswordStrengthTimeout: any;

  constructor(
    protected formBuilder: FormBuilder,
    protected authService: AuthService,
    protected router: Router,
    i18nService: I18nService,
    protected cryptoService: CryptoService,
    protected apiService: ApiService,
    protected stateService: StateService,
    platformUtilsService: PlatformUtilsService,
    protected passwordGenerationService: PasswordGenerationService,
    environmentService: EnvironmentService,
    protected logService: LogService
  ) {
    super(environmentService, i18nService, platformUtilsService);
    this.showTerms = !platformUtilsService.isSelfHost();
  }

  async ngOnInit() {
    this.setupCaptcha();
  }

  get masterPasswordScoreWidth() {
    return this.masterPasswordScore == null ? 0 : (this.masterPasswordScore + 1) * 20;
  }

  get masterPasswordScoreColor() {
    switch (this.masterPasswordScore) {
      case 4:
        return "success";
      case 3:
        return "primary";
      case 2:
        return "warning";
      default:
        return "danger";
    }
  }

  get masterPasswordScoreText() {
    switch (this.masterPasswordScore) {
      case 4:
        return this.i18nService.t("strong");
      case 3:
        return this.i18nService.t("good");
      case 2:
        return this.i18nService.t("weak");
      default:
        return this.masterPasswordScore != null ? this.i18nService.t("weak") : null;
    }
  }

  async submit() {
    let email = this.formGroup.get("email")?.value;
    let name = this.formGroup.get("name")?.value;
    const masterPassword = this.formGroup.get("masterPassword")?.value;
    const confirmMasterPassword = this.formGroup.get("confirmMasterPassword")?.value;
    const hint = this.formGroup.get("hint")?.value;
    const acceptPolicies = this.formGroup.get("acceptPolicies")?.value;

    this.formGroup.markAllAsTouched();

    if (!this.formGroup.valid) {
      return;
    }

    if (!acceptPolicies && this.showTerms) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("acceptPoliciesError")
      );
      return;
    }

    if (email == null || email === "") {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("emailRequired")
      );
      return;
    }
    if (email.indexOf("@") === -1) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("invalidEmail")
      );
      return;
    }
    if (masterPassword == null || masterPassword === "") {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("masterPassRequired")
      );
      return;
    }
    if (masterPassword.length < 8) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("masterPassLength")
      );
      return;
    }
    if (masterPassword !== confirmMasterPassword) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("masterPassDoesntMatch")
      );
      return;
    }

    const strengthResult = this.passwordGenerationService.passwordStrength(
      masterPassword,
      this.getPasswordStrengthUserInput()
    );
    if (strengthResult != null && strengthResult.score < 3) {
      const result = await this.platformUtilsService.showDialog(
        this.i18nService.t("weakMasterPasswordDesc"),
        this.i18nService.t("weakMasterPassword"),
        this.i18nService.t("yes"),
        this.i18nService.t("no"),
        "warning"
      );
      if (!result) {
        return;
      }
    }

    if (hint === masterPassword) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("hintEqualsPassword")
      );
      return;
    }

    name = name === "" ? null : name;
    email = email.trim().toLowerCase();
    const kdf = DEFAULT_KDF_TYPE;
    const kdfIterations = DEFAULT_KDF_ITERATIONS;
    const key = await this.cryptoService.makeKey(masterPassword, email, kdf, kdfIterations);
    const encKey = await this.cryptoService.makeEncKey(key);
    const hashedPassword = await this.cryptoService.hashPassword(masterPassword, key);
    const keys = await this.cryptoService.makeKeyPair(encKey[0]);
    const request = new RegisterRequest(
      email,
      name,
      hashedPassword,
      hint,
      encKey[1].encryptedString,
      kdf,
      kdfIterations,
      this.referenceData,
      this.captchaToken
    );
    request.keys = new KeysRequest(keys[0], keys[1].encryptedString);
    const orgInvite = await this.stateService.getOrganizationInvitation();
    if (orgInvite != null && orgInvite.token != null && orgInvite.organizationUserId != null) {
      request.token = orgInvite.token;
      request.organizationUserId = orgInvite.organizationUserId;
    }

    try {
      this.formPromise = this.apiService.postRegister(request);
      try {
        await this.formPromise;
      } catch (e) {
        if (this.handleCaptchaRequired(e)) {
          return;
        } else {
          throw e;
        }
      }
      this.platformUtilsService.showToast("success", null, this.i18nService.t("newAccountCreated"));
      this.router.navigate([this.successRoute], { queryParams: { email: email } });
    } catch (e) {
      this.logService.error(e);
    }
  }

  togglePassword(confirmField: boolean) {
    this.showPassword = !this.showPassword;
    confirmField
      ? this.masterPasswordRetypeRef.nativeElement.focus()
      : this.masterPasswordRef.nativeElement.focus();
    // document.getElementById(confirmField ? "masterPasswordRetype" : "masterPassword").focus();
  }

  updatePasswordStrength() {
    const masterPassword = this.formGroup.get("masterPassword")?.value;

    if (this.masterPasswordStrengthTimeout != null) {
      clearTimeout(this.masterPasswordStrengthTimeout);
    }
    this.masterPasswordStrengthTimeout = setTimeout(() => {
      const strengthResult = this.passwordGenerationService.passwordStrength(
        masterPassword,
        this.getPasswordStrengthUserInput()
      );
      this.masterPasswordScore = strengthResult == null ? null : strengthResult.score;
    }, 300);
  }

  private getPasswordStrengthUserInput() {
    let userInput: string[] = [];
    const email = this.formGroup.get("email")?.value;
    const name = this.formGroup.get("name").value;
    const atPosition = email.indexOf("@");
    if (atPosition > -1) {
      userInput = userInput.concat(
        email
          .substr(0, atPosition)
          .trim()
          .toLowerCase()
          .split(/[^A-Za-z0-9]/)
      );
    }
    if (name != null && name !== "") {
      userInput = userInput.concat(name.trim().toLowerCase().split(" "));
    }
    return userInput;
  }
}

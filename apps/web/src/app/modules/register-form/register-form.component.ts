import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { first } from "rxjs/operators";

import { CaptchaProtectedComponent } from "@bitwarden/angular/components/captchaProtected.component";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { AuthService } from "@bitwarden/common/abstractions/auth.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { EnvironmentService } from "@bitwarden/common/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PasswordGenerationService } from "@bitwarden/common/abstractions/passwordGeneration.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { PolicyService } from "@bitwarden/common/abstractions/policy.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { DEFAULT_KDF_ITERATIONS, DEFAULT_KDF_TYPE } from "@bitwarden/common/enums/kdfType";
import { PolicyData } from "@bitwarden/common/models/data/policyData";
import { MasterPasswordPolicyOptions } from "@bitwarden/common/models/domain/masterPasswordPolicyOptions";
import { Policy } from "@bitwarden/common/models/domain/policy";
import { KeysRequest } from "@bitwarden/common/models/request/keysRequest";
import { ReferenceEventRequest } from "@bitwarden/common/models/request/referenceEventRequest";
import { RegisterRequest } from "@bitwarden/common/models/request/registerRequest";

import { RouterService } from "src/app/services/router.service";

@Component({
  selector: "app-register-form",
  templateUrl: "./register-form.component.html",
})
export class RegisterFormComponent extends CaptchaProtectedComponent implements OnInit {
  @ViewChild("masterPassword") masterPasswordRef: ElementRef;
  @ViewChild("masterPasswordRetype") masterPasswordRetypeRef: ElementRef;

  showTerms = true;
  showCreateOrgMessage = false;
  masterPasswordScore: number;
  showPassword = false;
  referenceData: ReferenceEventRequest;
  enforcedPolicyOptions: MasterPasswordPolicyOptions;
  formGroup: FormGroup;
  formPromise: Promise<any>;
  showErrorSummary = false;

  private policies: Policy[];

  protected successRoute = "login";
  private masterPasswordStrengthTimeout: any;

  constructor(
    private formBuilder: FormBuilder,
    authService: AuthService,
    private router: Router,
    i18nService: I18nService,
    private cryptoService: CryptoService,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private stateService: StateService,
    platformUtilsService: PlatformUtilsService,
    private passwordGenerationService: PasswordGenerationService,
    private policyService: PolicyService,
    environmentService: EnvironmentService,
    private logService: LogService,
    private routerService: RouterService
  ) {
    super(environmentService, i18nService, platformUtilsService);
    this.showTerms = !platformUtilsService.isSelfHost();
  }

  async ngOnInit() {
    this.createRegisterForm();

    this.route.queryParams.pipe(first()).subscribe((qParams) => {
      this.referenceData = new ReferenceEventRequest();
      if (qParams.email != null && qParams.email.indexOf("@") > -1) {
        this.formGroup.get("email")?.setValue(qParams.email);
      }
      if (qParams.premium != null) {
        this.routerService.setPreviousUrl("/settings/premium");
      } else if (qParams.org != null) {
        this.showCreateOrgMessage = true;
        this.referenceData.flow = qParams.org;
        const route = this.router.createUrlTree(["create-organization"], {
          queryParams: { plan: qParams.org },
        });
        this.routerService.setPreviousUrl(route.toString());
      }

      if (qParams.reference != null) {
        this.referenceData.id = qParams.reference;
      } else {
        this.referenceData.id = ("; " + document.cookie)
          .split("; reference=")
          .pop()
          .split(";")
          .shift();
      }
      // Are they coming from an email for sponsoring a families organization
      if (qParams.sponsorshipToken != null) {
        // After logging in redirect them to setup the families sponsorship
        const route = this.router.createUrlTree(["setup/families-for-enterprise"], {
          queryParams: { plan: qParams.sponsorshipToken },
        });
        this.routerService.setPreviousUrl(route.toString());
      }
      if (this.referenceData.id === "") {
        this.referenceData.id = null;
      }
    });
    const invite = await this.stateService.getOrganizationInvitation();
    if (invite != null) {
      try {
        const policies = await this.apiService.getPoliciesByToken(
          invite.organizationId,
          invite.token,
          invite.email,
          invite.organizationUserId
        );
        if (policies.data != null) {
          const policiesData = policies.data.map((p) => new PolicyData(p));
          this.policies = policiesData.map((p) => new Policy(p));
        }
      } catch (e) {
        this.logService.error(e);
      }
    }

    if (this.policies != null) {
      this.enforcedPolicyOptions = await this.policyService.getMasterPasswordPolicyOptions(
        this.policies
      );
    }

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

    // if (!acceptPolicies && this.showTerms) {
    //   this.platformUtilsService.showToast(
    //     "error",
    //     this.i18nService.t("errorOccurred"),
    //     this.i18nService.t("acceptPoliciesError")
    //   );
    //   return;
    // }

    this.formGroup.markAllAsTouched();
    this.showErrorSummary = true;

    if (!this.formGroup.valid) {
      return;
    }

    if (
      this.enforcedPolicyOptions != null &&
      !this.policyService.evaluateMasterPassword(
        this.masterPasswordScore,
        masterPassword,
        this.enforcedPolicyOptions
      )
    ) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("masterPasswordPolicyRequirementsNotMet")
      );
      return;
    }

    console.log("Here::", acceptPolicies, this.showTerms);

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

  private createRegisterForm() {
    this.formGroup = this.formBuilder.group({
      email: ["", [Validators.required, Validators.email]],
      name: [""],
      masterPassword: ["", [Validators.required]],
      confirmMasterPassword: ["", [Validators.required]],
      hint: [],
      acceptPolicies: [false, [Validators.requiredTrue]],
    });
  }
}

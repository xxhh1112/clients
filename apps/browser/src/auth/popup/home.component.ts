import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";

import { EnvironmentSelectorComponent } from "@bitwarden/angular/auth/components/environment-selector.component";
import { LoginService } from "@bitwarden/common/auth/abstractions/login.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";

@Component({
  selector: "app-home",
  templateUrl: "home.component.html",
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild(EnvironmentSelectorComponent, { static: true })
  environmentSelector!: EnvironmentSelectorComponent;
  private destroyed$: Subject<void> = new Subject();

  loginInitiated = false;
  //use this to redirect somehwere else after login
  redirectPath: string;
  sessionId: string;
  formGroup = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
    rememberEmail: [false],
  });

  constructor(
    protected platformUtilsService: PlatformUtilsService,
    private stateService: StateService,
    private formBuilder: FormBuilder,
    private router: Router,
    private i18nService: I18nService,
    private environmentService: EnvironmentService,
    private loginService: LoginService,
    protected route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    this.route?.queryParams.pipe(takeUntil(this.destroyed$)).subscribe((params) => {
      this.redirectPath = params?.redirectPath;
      this.sessionId = params?.sessionId;
    });

    let savedEmail = this.loginService.getEmail();
    const rememberEmail = this.loginService.getRememberEmail();

    if (savedEmail != null) {
      this.formGroup.patchValue({
        email: savedEmail,
        rememberEmail: rememberEmail,
      });
    } else {
      savedEmail = await this.stateService.getRememberedEmail();
      if (savedEmail != null) {
        this.formGroup.patchValue({
          email: savedEmail,
          rememberEmail: true,
        });
      }
    }

    this.environmentSelector.onOpenSelfHostedSettings
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.setFormValues();
        this.router.navigate(["environment"]);
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  submit() {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccured"),
        this.i18nService.t("invalidEmail")
      );
      return;
    }

    this.loginService.setEmail(this.formGroup.value.email);
    this.loginService.setRememberEmail(this.formGroup.value.rememberEmail);

    this.router.navigate(["login"], {
      queryParams: {
        email: this.formGroup.value.email,
        redirectPath: this.redirectPath,
        sessionId: this.sessionId,
      },
    });
  }

  get selfHostedDomain() {
    return this.environmentService.hasBaseUrl() ? this.environmentService.getWebVaultUrl() : null;
  }

  setFormValues() {
    this.loginService.setEmail(this.formGroup.value.email);
    this.loginService.setRememberEmail(this.formGroup.value.rememberEmail);
  }
}

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

import { BrowserFido2UserInterfaceSession } from "../../vault/fido2/browser-fido2-user-interface.service";

@Component({
  selector: "app-home",
  templateUrl: "home.component.html",
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild(EnvironmentSelectorComponent, { static: true })
  environmentSelector!: EnvironmentSelectorComponent;
  private destroyed$: Subject<void> = new Subject();
  private sessionId?: string; // Used to uniquely identify passkeys

  loginInitiated = false;
  formGroup = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
    rememberEmail: [false],
  });

  get isPasskeysPopout(): boolean {
    return this.sessionId != null;
  }

  constructor(
    protected platformUtilsService: PlatformUtilsService,
    private stateService: StateService,
    private formBuilder: FormBuilder,
    private router: Router,
    private i18nService: I18nService,
    private environmentService: EnvironmentService,
    private loginService: LoginService,
    private route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
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

    // Get's the sessionId from the query params. The sessionId is sent from the passkeys popout.
    this.sessionId = this.route.snapshot.queryParams.sessionId;
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
    this.router.navigate(["login"], { queryParams: { email: this.formGroup.value.email } });
  }

  get selfHostedDomain() {
    return this.environmentService.hasBaseUrl() ? this.environmentService.getWebVaultUrl() : null;
  }

  setFormValues() {
    this.loginService.setEmail(this.formGroup.value.email);
    this.loginService.setRememberEmail(this.formGroup.value.rememberEmail);
  }

  // Used for aborting Fido2 popout
  abortFido2Popout(fallback = false) {
    BrowserFido2UserInterfaceSession.sendMessage({
      sessionId: this.sessionId,
      type: "AbortResponse",
      fallbackRequested: fallback,
    });

    return;
  }
}

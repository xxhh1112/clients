import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";

import { EnvironmentService } from "@bitwarden/common/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { CaptchaIFrame } from "@bitwarden/common/misc/captcha_iframe";

/**
 * HCaptcha component, shows the captcha and emits an event when the captcha is solved.
 */
@Component({
  selector: "app-captcha",
  template: `<iframe id="hcaptcha_iframe" height="80"></iframe>`,
})
export class CaptchaComponent implements OnInit, OnDestroy {
  @Input() siteKey: string;
  @Output() captchaSolved = new EventEmitter<string>();

  private captcha: CaptchaIFrame;

  constructor(
    protected environmentService: EnvironmentService,
    protected i18nService: I18nService,
    protected platformUtilsService: PlatformUtilsService
  ) {}

  ngOnInit(): void {
    const webVaultUrl = this.environmentService.getWebVaultUrl();

    this.captcha = new CaptchaIFrame(
      window,
      webVaultUrl,
      this.i18nService,
      (token: string) => {
        this.captchaSolved.emit(token);
      },
      (error: string) => {
        this.platformUtilsService.showToast("error", this.i18nService.t("errorOccurred"), error);
      },
      (info: string) => {
        this.platformUtilsService.showToast("info", this.i18nService.t("info"), info);
      }
    );
    this.captcha.init(this.siteKey);
  }

  ngOnDestroy(): void {
    this.captcha.cleanup();
  }
}

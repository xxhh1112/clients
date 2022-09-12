import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output } from "@angular/core";

import { EnvironmentService } from "@bitwarden/common/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { IFrameComponent } from "@bitwarden/common/misc/iframe_component";

/**
 * HCaptcha component, shows the captcha and emits an event when the captcha is solved.
 */
@Component({
  selector: "app-captcha",
  template: `<iframe [id]="id" height="80"></iframe>`,
})
export class CaptchaComponent implements AfterViewInit, OnDestroy {
  @Input() siteKey: string;
  @Output() captchaSolved = new EventEmitter<string>();

  private iframeHandler: IFrameComponent;

  private readonly connectorUrl = "captcha-connector.html";
  protected readonly id = "hcaptcha_iframe";

  constructor(
    protected environmentService: EnvironmentService,
    protected i18nService: I18nService,
    protected platformUtilsService: PlatformUtilsService
  ) {}

  ngAfterViewInit(): void {
    const webVaultUrl = this.environmentService.getWebVaultUrl();

    this.iframeHandler = new IFrameComponent(
      window,
      webVaultUrl,
      this.connectorUrl,
      this.id,
      (token: string) => {
        this.captchaSolved.emit(token);
      },
      (error: string) => {
        this.platformUtilsService.showToast("error", this.i18nService.t("errorOccurred"), error);
      },
      (message: string) => {
        const parsedMessage = JSON.parse(message);
        if (typeof parsedMessage !== "string") {
          this.iframeHandler.iframe.height = parsedMessage.height.toString();
          this.iframeHandler.iframe.width = parsedMessage.width.toString();
        } else {
          this.platformUtilsService.showToast("info", this.i18nService.t("info"), parsedMessage);
        }
      }
    );

    const data = {
      siteKey: this.siteKey,
      locale: this.i18nService.translationLocale,
    };
    const params = this.iframeHandler.createParams(data, 1);
    this.iframeHandler.initComponent(params);
  }

  ngOnDestroy(): void {
    this.iframeHandler.cleanup();
  }
}

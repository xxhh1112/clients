import { Component, OnInit } from "@angular/core";

import { SettingsService } from "@bitwarden/common/abstractions/settings.service";
import { UriMatchType } from "@bitwarden/common/enums";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config.service.abstraction";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";

import { AutofillOverlayAppearance } from "../../autofill/utils/autofill-overlay.enum";
import { BrowserApi } from "../../platform/browser/browser-api";

@Component({
  selector: "app-autofill",
  templateUrl: "autofill.component.html",
})
export class AutofillComponent implements OnInit {
  isAutoFillOverlayFlagEnabled = false;
  enableAutoFillOverlay = false;
  autoFillOverlayAppearance: number;
  autoFillOverlayAppearanceOptions: any[];
  enableAutoFillOnPageLoad = false;
  autoFillOnPageLoadDefault = false;
  autoFillOnPageLoadOptions: any[];
  defaultUriMatch = UriMatchType.Domain;
  uriMatchOptions: any[];
  autofillKeyboardHelperText: string;

  constructor(
    private stateService: StateService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
    private configService: ConfigServiceAbstraction,
    private settingsService: SettingsService
  ) {
    this.autoFillOverlayAppearanceOptions = [
      {
        name: i18nService.t("autofillOverlayAppearanceOnFieldFocus"),
        value: AutofillOverlayAppearance.OnFieldFocus,
      },
      {
        name: i18nService.t("autofillOverlayAppearanceOnButtonClick"),
        value: AutofillOverlayAppearance.OnButtonClick,
      },
    ];
    this.autoFillOnPageLoadOptions = [
      { name: i18nService.t("autoFillOnPageLoadYes"), value: true },
      { name: i18nService.t("autoFillOnPageLoadNo"), value: false },
    ];
    this.uriMatchOptions = [
      { name: i18nService.t("baseDomain"), value: UriMatchType.Domain },
      { name: i18nService.t("host"), value: UriMatchType.Host },
      { name: i18nService.t("startsWith"), value: UriMatchType.StartsWith },
      { name: i18nService.t("regEx"), value: UriMatchType.RegularExpression },
      { name: i18nService.t("exact"), value: UriMatchType.Exact },
      { name: i18nService.t("never"), value: UriMatchType.Never },
    ];
  }

  async ngOnInit() {
    this.isAutoFillOverlayFlagEnabled = await this.configService.getFeatureFlag<boolean>(
      FeatureFlag.AutofillOverlay
    );
    this.enableAutoFillOverlay = await this.settingsService.getEnableAutoFillOverlay();
    this.autoFillOverlayAppearance =
      (await this.settingsService.getAutoFillOverlayAppearance()) ||
      AutofillOverlayAppearance.OnFieldFocus;

    this.enableAutoFillOnPageLoad = await this.stateService.getEnableAutoFillOnPageLoad();
    this.autoFillOnPageLoadDefault =
      (await this.stateService.getAutoFillOnPageLoadDefault()) ?? true;

    const defaultUriMatch = await this.stateService.getDefaultUriMatch();
    this.defaultUriMatch = defaultUriMatch == null ? UriMatchType.Domain : defaultUriMatch;

    const command = await this.platformUtilsService.getAutofillKeyboardShortcut();
    await this.setAutofillKeyboardHelperText(command);
  }

  async updateEnableAutoFillOverlay() {
    await this.settingsService.setEnableAutoFillOverlay(this.enableAutoFillOverlay);
  }

  async updateAutoFillOverlayAppearance() {
    await this.settingsService.setAutoFillOverlayAppearance(this.autoFillOverlayAppearance);
  }

  async updateAutoFillOnPageLoad() {
    await this.stateService.setEnableAutoFillOnPageLoad(this.enableAutoFillOnPageLoad);
  }

  async updateAutoFillOnPageLoadDefault() {
    await this.stateService.setAutoFillOnPageLoadDefault(this.autoFillOnPageLoadDefault);
  }

  async saveDefaultUriMatch() {
    await this.stateService.setDefaultUriMatch(this.defaultUriMatch);
  }

  private async setAutofillKeyboardHelperText(command: string) {
    if (command) {
      this.autofillKeyboardHelperText = this.i18nService.t("autofillShortcutText", command);
    } else {
      this.autofillKeyboardHelperText = this.i18nService.t("autofillShortcutNotSet");
    }
  }

  async commandSettings() {
    if (this.platformUtilsService.isChrome()) {
      BrowserApi.createNewTab("chrome://extensions/shortcuts");
    } else if (this.platformUtilsService.isOpera()) {
      BrowserApi.createNewTab("opera://extensions/shortcuts");
    } else if (this.platformUtilsService.isEdge()) {
      BrowserApi.createNewTab("edge://extensions/shortcuts");
    } else if (this.platformUtilsService.isVivaldi()) {
      BrowserApi.createNewTab("vivaldi://extensions/shortcuts");
    } else {
      BrowserApi.createNewTab("https://bitwarden.com/help/keyboard-shortcuts");
    }
  }
}

import { Component, Input } from "@angular/core";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { SendAccessView } from "@bitwarden/common/tools/send/models/view/send-access.view";

import { SharedModule } from "../../shared";

@Component({
  selector: "app-send-access-text",
  templateUrl: "send-access-text.component.html",
  imports: [SharedModule],
  standalone: true,
})
export class SendAccessTextComponent {
  private _send: SendAccessView = null;
  showText = false;

  constructor(
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService
  ) {}

  get send(): SendAccessView {
    return this._send;
  }

  @Input() set send(value: SendAccessView) {
    this._send = value;
    this.showText = this.send.text != null ? !this.send.text.hidden : true;
  }

  get sendText() {
    if (this.send == null || this.send.text == null) {
      return null;
    }
    return this.showText ? this.send.text.text : this.send.text.maskedText;
  }

  copyText() {
    this.platformUtilsService.copyToClipboard(this.send.text.text);
    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("valueCopied", this.i18nService.t("sendTypeText"))
    );
  }

  toggleText() {
    this.showText = !this.showText;
  }
}

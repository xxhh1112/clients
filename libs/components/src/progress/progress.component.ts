import { Component, Input } from "@angular/core";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";

type SizeTypes = "small" | "default" | "large";
// type ProgressTypes = "progress" | "strength";

const SizeClasses: Record<SizeTypes, string[]> = {
  small: ["tw-h-1"],
  default: ["tw-h-4"],
  large: ["tw-h-6"],
};

@Component({
  selector: "bit-progress",
  templateUrl: "./progress.component.html",
})
export class ProgressComponent {
  @Input() barWidth = 0;
  @Input() showText = true;
  @Input() size: SizeTypes = "default";
  // @Input() type: ProgressTypes = "progress";

  constructor(private i18nService: I18nService) {}

  // Only show the text that fits in the inner bar
  get displayText() {
    return this.showText && this.size !== "small" && this.barWidth > 3;
  }

  get outerBarStyles() {
    return ["tw-overflow-hidden", "tw-rounded", "tw-bg-secondary-100"].concat(
      SizeClasses[this.size]
    );
  }

  get innerBarStyles() {
    return [
      "tw-flex",
      "tw-items-center",
      "tw-justify-center",
      "tw-whitespace-nowrap",
      "tw-text-xs",
      "tw-font-semibold",
      "tw-text-contrast",
      "tw-transition-all",
      "tw-bg-primary-500",
    ].concat(SizeClasses[this.size]);

    // if (this.type === "strength") {
    //   if (this.barWidth <= 25) {
    //     return "tw-bg-danger-500";
    //   }
    //   if (this.barWidth <= 50) {
    //     return "tw-bg-warning-500";
    //   }
    //   if (this.barWidth <= 99) {
    //     return "tw-bg-primary-500";
    //   }
    //   return "tw-bg-success-500";
    // }
    // return `tw-bg-primary-500`;
  }

  get textContent() {
    return this.barWidth + "%";

    // if (this.type === "strength") {
    //   if (this.barWidth <= 50) {
    //     return this.i18nService.t("weak");
    //   }
    //   if (this.barWidth <= 99) {
    //     return this.i18nService.t("good");
    //   }
    //   return this.i18nService.t("strong");
    // }
    // return `${this.barWidth}%`;
  }
}

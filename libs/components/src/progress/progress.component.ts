import { Component, Input } from "@angular/core";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";

type SizeTypes = "small" | "default" | "large";
type ProgressTypes = "progress" | "strength";

const sizeClasses: Record<SizeTypes, string> = {
  small: "tw-h-1",
  default: "tw-h-4",
  large: "tw-h-6",
};

@Component({
  selector: "bit-progress",
  templateUrl: "./progress.component.html",
})
export class ProgressComponent {
  @Input() barWidth = 0;
  @Input() showText = true;
  @Input() size: SizeTypes = "default";
  @Input() type: ProgressTypes = "progress";

  constructor(private i18nService: I18nService) {}

  /**
   * Only display text if size is not small, or if barWidth is above 3%,
   * otherwise the text gets crammed or cut off.
   */
  get displayText() {
    return this.showText && this.size !== "small" && this.barWidth > 3;
  }

  get sizeClass() {
    return sizeClasses[this.size];
  }

  get bgClass() {
    if (this.type === "strength") {
      if (this.barWidth <= 25) {
        return "tw-bg-danger-500";
      }
      if (this.barWidth <= 50) {
        return "tw-bg-warning-500";
      }
      if (this.barWidth <= 99) {
        return "tw-bg-primary-500";
      }
      return "tw-bg-success-500";
    }
    return `tw-bg-primary-500`;
  }

  get textContent() {
    if (this.type === "strength") {
      if (this.barWidth <= 50) {
        return this.i18nService.t("weak");
      }
      if (this.barWidth <= 99) {
        return this.i18nService.t("good");
      }
      return this.i18nService.t("strong");
    }
    return `${this.barWidth}%`;
  }

  /**
   <ng-container *ngIf="showText && size !== 'small' && barWidth > 3">
      {{ textContent }}
    </ng-container>
   */
}

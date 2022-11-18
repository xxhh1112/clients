import { Component, Input } from "@angular/core";

type SizeTypes = "small" | "default" | "large";
type ProgressTypes = "percent" | "strength";

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
  @Input() type: ProgressTypes = "percent";

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
        return "Weak";
      }
      if (this.barWidth <= 99) {
        return "Good";
      }
      return "Strong";
    }
    return `${this.barWidth}%`;
  }
}

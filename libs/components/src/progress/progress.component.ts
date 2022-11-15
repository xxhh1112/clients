import { Component, Input } from "@angular/core";

type SizeTypes = "large" | "default" | "small";
type ProgressTypes = "percent" | "strength";

@Component({
  selector: "bit-progress",
  templateUrl: "./progress.component.html",
})
export class ProgressComponent {
  @Input() showText = true;
  @Input() size: SizeTypes = "default";
  @Input() type: ProgressTypes = "percent";

  @Input() barWidth: number;
  @Input() text: string;

  get sizeClass() {
    switch (this.size) {
      case "small":
        return `tw-h-1`;
      case "large":
        return `tw-h-6`;
      default:
        return `tw-h-4`;
    }
  }

  get bgClass() {
    switch (this.type) {
      case "strength":
        if (this.barWidth <= 40) {
          return `tw-bg-danger-500`;
        } else if (this.barWidth <= 60) {
          return `tw-bg-warning-500`;
        } else if (this.barWidth <= 99) {
          return `tw-bg-primary-500`;
        } else {
          return `tw-bg-success-500`;
        }
      default:
        return `tw-bg-primary-500`;
    }
  }

  get textContent() {
    if (this.barWidth <= 60) {
      return `Weak`;
    } else if (this.barWidth <= 99) {
      return `Good`;
    } else {
      return `Strong`;
    }
  }
}

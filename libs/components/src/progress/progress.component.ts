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

  barWidth: 0;

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

  get typeClass() {
    switch (this.type) {
      case "strength":
        return `tw-bg-danger-500`;
      default:
        return `tw-bg-primary-500`;
    }
  }
}

import { ConnectedPosition } from "@angular/cdk/overlay";
import { Component, Input } from "@angular/core";

@Component({
  selector: "bit-popover",
  templateUrl: "./popover.component.html",
})
export class PopoverComponent {
  @Input() header = "";

  isOpen = false;
  overlayPositions: ConnectedPosition[] = [
    // Popover opens to right of trigger
    {
      offsetX: 5,
      originX: "end",
      originY: "center",
      overlayX: "start",
      overlayY: "center",
    },
    // ... to left of trigger
    {
      offsetX: -5,
      originX: "start",
      originY: "center",
      overlayX: "end",
      overlayY: "center",
    },
    // ... above trigger
    {
      offsetY: -5,
      originX: "center",
      originY: "top",
      overlayX: "center",
      overlayY: "bottom",
    },
    // ... below trigger
    {
      offsetY: 5,
      originX: "center",
      originY: "bottom",
      overlayX: "center",
      overlayY: "top",
    },
  ];
}

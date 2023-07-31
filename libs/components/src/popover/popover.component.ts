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
      offsetY: -36,
      originX: "end",
      originY: "center",
      overlayX: "start",
      overlayY: "top",
      panelClass: "bit-popover-right",
    },
    // ... to left of trigger
    {
      offsetX: -5,
      offsetY: -36,
      originX: "start",
      originY: "center",
      overlayX: "end",
      overlayY: "top",
      panelClass: "bit-popover-left",
    },
    // ... above trigger
    {
      offsetY: -5,
      originX: "center",
      originY: "top",
      overlayX: "center",
      overlayY: "bottom",
      panelClass: "bit-popover-above",
    },
    // ... below trigger
    {
      offsetY: 5,
      originX: "center",
      originY: "bottom",
      overlayX: "center",
      overlayY: "top",
      panelClass: "bit-popover-below",
    },
  ];
}

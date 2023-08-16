import { ConnectedPosition } from "@angular/cdk/overlay";

const ORIGIN_OFFSET_PX = 6;
const OVERLAY_OFFSET_PX = 24;

export const popoverPositions: ConnectedPosition[] = [
  /**
   * The order of these positions matters. The first position will take precedence
   * over the second (assuming it fits in the viewport), and so forth.
   */

  // Popover opens to right of trigger
  {
    offsetX: ORIGIN_OFFSET_PX,
    originX: "end",
    originY: "center",
    overlayX: "start",
    overlayY: "center",
    panelClass: ["bit-popover-right", "bit-popover-right-center"],
  },
  {
    offsetX: ORIGIN_OFFSET_PX,
    offsetY: -OVERLAY_OFFSET_PX,
    originX: "end",
    originY: "center",
    overlayX: "start",
    overlayY: "top",
    panelClass: ["bit-popover-right", "bit-popover-right-top"],
  },
  {
    offsetX: ORIGIN_OFFSET_PX,
    offsetY: OVERLAY_OFFSET_PX,
    originX: "end",
    originY: "center",
    overlayX: "start",
    overlayY: "bottom",
    panelClass: ["bit-popover-right", "bit-popover-right-bottom"],
  },
  // ... to left of trigger
  {
    offsetX: -ORIGIN_OFFSET_PX,
    originX: "start",
    originY: "center",
    overlayX: "end",
    overlayY: "center",
    panelClass: ["bit-popover-left", "bit-popover-left-center"],
  },
  {
    offsetX: -ORIGIN_OFFSET_PX,
    offsetY: -OVERLAY_OFFSET_PX,
    originX: "start",
    originY: "center",
    overlayX: "end",
    overlayY: "top",
    panelClass: ["bit-popover-left", "bit-popover-left-top"],
  },
  {
    offsetX: -ORIGIN_OFFSET_PX,
    offsetY: OVERLAY_OFFSET_PX,
    originX: "start",
    originY: "center",
    overlayX: "end",
    overlayY: "bottom",
    panelClass: ["bit-popover-left", "bit-popover-left-bottom"],
  },
  // ... below trigger
  {
    offsetY: ORIGIN_OFFSET_PX,
    originX: "center",
    originY: "bottom",
    overlayX: "center",
    overlayY: "top",
    panelClass: ["bit-popover-below", "bit-popover-below-center"],
  },
  {
    offsetX: -OVERLAY_OFFSET_PX,
    offsetY: ORIGIN_OFFSET_PX,
    originX: "center",
    originY: "bottom",
    overlayX: "start",
    overlayY: "top",
    panelClass: ["bit-popover-below", "bit-popover-below-start"],
  },
  {
    offsetX: OVERLAY_OFFSET_PX,
    offsetY: ORIGIN_OFFSET_PX,
    originX: "center",
    originY: "bottom",
    overlayX: "end",
    overlayY: "top",
    panelClass: ["bit-popover-below", "bit-popover-below-end"],
  },
  // ... above trigger
  {
    offsetY: -ORIGIN_OFFSET_PX,
    originX: "center",
    originY: "top",
    overlayX: "center",
    overlayY: "bottom",
    panelClass: ["bit-popover-above", "bit-popover-above-center"],
  },
  {
    offsetX: -OVERLAY_OFFSET_PX,
    offsetY: -ORIGIN_OFFSET_PX,
    originX: "center",
    originY: "top",
    overlayX: "start",
    overlayY: "bottom",
    panelClass: ["bit-popover-above", "bit-popover-above-start"],
  },
  {
    offsetX: OVERLAY_OFFSET_PX,
    offsetY: -ORIGIN_OFFSET_PX,
    originX: "center",
    originY: "top",
    overlayX: "end",
    overlayY: "bottom",
    panelClass: ["bit-popover-above", "bit-popover-above-end"],
  },
];

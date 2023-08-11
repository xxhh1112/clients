import { Overlay, OverlayConfig, OverlayRef } from "@angular/cdk/overlay";
import { TemplatePortal } from "@angular/cdk/portal";
import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  ViewContainerRef,
} from "@angular/core";

import { PopoverComponent } from "./popover.component";

@Directive({
  selector: "[bitPopoverTriggerFor]",
})
export class PopoverTriggerForDirective {
  @HostBinding("attr.aria-expanded")
  isOpen = false;

  @Input("bitPopoverTriggerFor")
  popover: PopoverComponent;

  private overlayRef: OverlayRef;
  private defaultPopoverConfig: OverlayConfig = {
    panelClass: "bit-popover-panel",
    hasBackdrop: true,
    backdropClass: "cdk-overlay-transparent-backdrop",
    scrollStrategy: this.overlay.scrollStrategies.reposition(),
    positionStrategy: this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions([
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
      ])
      .withLockedPosition(true)
      .withFlexibleDimensions(false)
      .withPush(true),
  };

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private viewContainerRef: ViewContainerRef,
    private overlay: Overlay
  ) {}

  @HostListener("click")
  togglePopover() {
    this.isOpen ? this.destroyPopover() : this.openPopover();
  }

  private openPopover() {
    this.isOpen = true;
    this.overlayRef = this.overlay.create(this.defaultPopoverConfig);

    const templatePortal = new TemplatePortal(this.popover.templateRef, this.viewContainerRef);
    this.overlayRef.attach(templatePortal);
  }

  private destroyPopover() {
    if (this.overlayRef == null || !this.isOpen) {
      return;
    }

    this.isOpen = false;
  }
}

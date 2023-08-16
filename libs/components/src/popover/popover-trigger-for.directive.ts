import { Overlay, OverlayConfig, OverlayRef } from "@angular/cdk/overlay";
import { TemplatePortal } from "@angular/cdk/portal";
import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  ViewContainerRef,
} from "@angular/core";
import { Observable, Subscription, mergeWith } from "rxjs";

import { popoverPositions } from "./popover-positions";
import { PopoverComponent } from "./popover.component";

@Directive({
  selector: "[bitPopoverTriggerFor]",
})
export class PopoverTriggerForDirective implements OnDestroy {
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
      .withPositions(popoverPositions)
      .withLockedPosition(true)
      .withFlexibleDimensions(false)
      .withPush(true),
  };
  private closedEventsSub: Subscription;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private viewContainerRef: ViewContainerRef,
    private overlay: Overlay
  ) {}

  @HostListener("click")
  togglePopover() {
    this.isOpen ? this.destroyPopover() : this.openPopover();
  }

  ngOnDestroy() {
    this.disposeAll();
  }

  private openPopover() {
    this.isOpen = true;
    this.overlayRef = this.overlay.create(this.defaultPopoverConfig);

    const templatePortal = new TemplatePortal(this.popover.templateRef, this.viewContainerRef);
    this.overlayRef.attach(templatePortal);

    this.closedEventsSub = this.getClosedEvents().subscribe(() => {
      this.destroyPopover();
    });
  }

  private getClosedEvents(): Observable<any> {
    const detachments = this.overlayRef.detachments();
    const backdrop = this.overlayRef.backdropClick();
    const popoverClosed = this.popover.closed;

    return detachments.pipe(mergeWith(backdrop, popoverClosed));
  }

  private destroyPopover() {
    if (this.overlayRef == null || !this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.disposeAll();
  }

  private disposeAll() {
    this.closedEventsSub?.unsubscribe();
    this.overlayRef?.dispose();
  }
}

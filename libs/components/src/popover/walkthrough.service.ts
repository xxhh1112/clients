import { Injectable, OnDestroy } from "@angular/core";

import { PopoverTriggerForDirective } from "./popover-trigger-for.directive";

@Injectable({
  providedIn: "root",
})
export class WalkthroughService implements OnDestroy {
  isWalkthrough = false;
  triggers: PopoverTriggerForDirective[] | null;

  get indexOfCurrentlyOpen() {
    const index = this.triggers.findIndex((trigger) => trigger.isOpen);
    return index === -1 ? 0 : index;
  }

  ngOnDestroy() {
    this.isWalkthrough = false;
    this.triggers = null;
  }

  next() {
    const currentIndex = this.indexOfCurrentlyOpen;
    const nextIndex = currentIndex + 1;

    this.triggers[currentIndex].closePopover();
    this.triggers[nextIndex].openPopover();
  }

  back() {
    const currentIndex = this.indexOfCurrentlyOpen;
    const previousIndex = currentIndex - 1;

    this.triggers[currentIndex].closePopover();
    this.triggers[previousIndex].openPopover();
  }

  isFirst() {
    return this.indexOfCurrentlyOpen === 0;
  }

  isLast() {
    return this.indexOfCurrentlyOpen === this.triggers.length - 1;
  }
}

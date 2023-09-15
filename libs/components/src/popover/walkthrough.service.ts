import { Injectable, OnDestroy, QueryList } from "@angular/core";

import { PopoverTriggerForDirective } from "./popover-trigger-for.directive";

@Injectable({
  providedIn: "root",
})
export class WalkthroughService implements OnDestroy {
  triggers: QueryList<PopoverTriggerForDirective>;
  currentTriggerIndex = 0;

  get triggerEls() {
    return this.triggers.toArray();
  }

  get numTriggers() {
    return this.triggers.length;
  }

  ngOnDestroy() {
    this.triggers = null;
    this.currentTriggerIndex = 0;
  }

  next() {
    this.triggerEls[this.currentTriggerIndex].closePopover();
    this.currentTriggerIndex++;
    this.triggerEls[this.currentTriggerIndex].openPopover();
  }

  back() {
    this.triggerEls[this.currentTriggerIndex].closePopover();
    this.currentTriggerIndex--;
    this.triggerEls[this.currentTriggerIndex].openPopover();
  }

  isFirst() {
    return this.currentTriggerIndex === 0;
  }

  isLast() {
    return this.currentTriggerIndex === this.triggers.length - 1;
  }
}

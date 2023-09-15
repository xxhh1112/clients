import { NgModule } from "@angular/core";

import { PopoverTriggerForDirective } from "./popover-trigger-for.directive";
import { PopoverComponent } from "./popover.component";
import { WalkthroughWrapperComponent } from "./walkthrough-wrapper.component";

@NgModule({
  imports: [PopoverComponent, PopoverTriggerForDirective, WalkthroughWrapperComponent],
  exports: [PopoverComponent, PopoverTriggerForDirective, WalkthroughWrapperComponent],
})
export class PopoverModule {}

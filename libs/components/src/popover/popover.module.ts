import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { PopoverTriggerForDirective } from "./popover-trigger-for.directive";
import { PopoverComponent } from "./popover.component";

@NgModule({
  imports: [CommonModule],
  declarations: [PopoverComponent, PopoverTriggerForDirective],
  exports: [PopoverComponent, PopoverTriggerForDirective],
})
export class PopoverModule {}

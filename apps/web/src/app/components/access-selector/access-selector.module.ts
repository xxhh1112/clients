import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared";

import { AccessSelectorComponent } from "./access-selector.component";

@NgModule({
  imports: [CommonModule, SharedModule],
  declarations: [AccessSelectorComponent],
  exports: [AccessSelectorComponent],
})
export class AccessSelectorModule {}

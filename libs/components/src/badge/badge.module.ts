import { NgModule } from "@angular/core";

import { SharedModule } from "../shared";

import { BadgeListComponent } from "./badge-list.component";
import { BadgeDirective } from "./badge.directive";

@NgModule({
  imports: [SharedModule],
  exports: [BadgeDirective, BadgeListComponent],
  declarations: [BadgeDirective, BadgeListComponent],
})
export class BadgeModule {}

import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { BadgeModule } from "../badge";

import { ButtonGroupElementComponent } from "./button-group-element.component";
import { ButtonGroupComponent } from "./button-group.component";

@NgModule({
  imports: [CommonModule, BadgeModule],
  exports: [ButtonGroupComponent, ButtonGroupElementComponent],
  declarations: [ButtonGroupComponent, ButtonGroupElementComponent],
})
export class ButtonGroupModule {}

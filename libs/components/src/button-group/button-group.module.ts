import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { BadgeModule } from "../badge";

import { ButtonGroupElementComponent } from "./button-group-element.component";
import { ButtonGroupComponent } from "./button-group.component";

@NgModule({
  imports: [CommonModule, FormsModule, BadgeModule],
  exports: [ButtonGroupComponent, ButtonGroupElementComponent],
  declarations: [ButtonGroupComponent, ButtonGroupElementComponent],
})
export class ButtonGroupModule {}

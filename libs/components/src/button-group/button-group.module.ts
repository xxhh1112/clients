import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { ButtonModule } from "../button/button.module";

import { ButtonGroupElementComponent } from "./button-group-element.component";
import { ButtonGroupComponent } from "./button-group.component";

@NgModule({
  imports: [CommonModule, ButtonModule],
  exports: [ButtonGroupComponent, ButtonGroupElementComponent],
  declarations: [ButtonGroupComponent, ButtonGroupElementComponent],
})
export class ButtonGroupModule {}

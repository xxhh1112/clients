import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { ButtonGroupComponent } from "./button-group.component";

@NgModule({
  imports: [CommonModule],
  exports: [ButtonGroupComponent],
  declarations: [ButtonGroupComponent],
})
export class ButtonGroupModule {}

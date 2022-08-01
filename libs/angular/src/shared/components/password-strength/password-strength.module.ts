import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared.module";

import { PasswordStrengthComponent } from "./password-strength.component";

@NgModule({
  imports: [SharedModule],
  declarations: [PasswordStrengthComponent],
  exports: [PasswordStrengthComponent],
})
export class PasswordStrengthModule {}

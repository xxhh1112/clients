import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { PasswordStrengthComponent } from "./components/password-strength.component";

@NgModule({
  declarations: [PasswordStrengthComponent],
  imports: [CommonModule],
  exports: [PasswordStrengthComponent],
})
export class SharedModule {}

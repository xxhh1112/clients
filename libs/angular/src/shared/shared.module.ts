import { NgModule } from "@angular/core";

import { PasswordStrengthModule } from "./components/password-strength/password-strength.module";

@NgModule({
  declarations: [],
  imports: [PasswordStrengthModule],
  exports: [PasswordStrengthModule],
})
export class SharedModule {}

import { NgModule } from "@angular/core";

import { FormFieldModule } from "@bitwarden/components";

import { SharedModule } from "../shared.module";

import { RegisterFormComponent } from "./register-form.component";

@NgModule({
  imports: [SharedModule, FormFieldModule],
  declarations: [RegisterFormComponent],
  exports: [RegisterFormComponent],
})
export class RegisterFormModule {}

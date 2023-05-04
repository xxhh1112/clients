import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared";

import { Fido2LoginSettingsComponent } from "./fido2-login-settings.component";

@NgModule({
  imports: [SharedModule],
  declarations: [Fido2LoginSettingsComponent],
  exports: [Fido2LoginSettingsComponent],
})
export class Fido2LoginSettingsModule {}

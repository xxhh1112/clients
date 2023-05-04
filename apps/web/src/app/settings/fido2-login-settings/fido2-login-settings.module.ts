import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared/shared.module";

import { CreateCredentialDialogComponent } from "./create-credential-dialog/create-credential-dialog.component";
import { Fido2LoginSettingsComponent } from "./fido2-login-settings.component";

@NgModule({
  imports: [SharedModule],
  declarations: [Fido2LoginSettingsComponent, CreateCredentialDialogComponent],
  exports: [Fido2LoginSettingsComponent],
})
export class Fido2LoginSettingsModule {}

import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { SharedModule } from "../../../shared/shared.module";

import { CreateCredentialDialogComponent } from "./create-credential-dialog/create-credential-dialog.component";
import { DeleteCredentialDialogComponent } from "./delete-credential-dialog/delete-credential-dialog.component";
import { Fido2LoginSettingsComponent } from "./fido2-login-settings.component";

@NgModule({
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
  declarations: [
    Fido2LoginSettingsComponent,
    CreateCredentialDialogComponent,
    DeleteCredentialDialogComponent,
  ],
  exports: [Fido2LoginSettingsComponent],
})
export class Fido2LoginSettingsModule {}

import { NgModule } from "@angular/core";

import { CheckboxModule } from "@bitwarden/components";

import { SharedModule } from "../../../app/shared";
import { AuthModule } from "../auth.module";

import { LoginDecryptionOptionsComponent } from "./login-decryption-options/login-decryption-options.component";
import { LoginWithDeviceComponent } from "./login-with-device.component";
import { LoginWithWebauthnComponent } from "./login-with-webauthn.component";
import { LoginComponent } from "./login.component";

@NgModule({
  imports: [SharedModule, CheckboxModule, AuthModule],
  declarations: [
    LoginComponent,
    LoginWithDeviceComponent,
    LoginDecryptionOptionsComponent,
    LoginWithWebauthnComponent,
  ],
  exports: [
    LoginComponent,
    LoginWithDeviceComponent,
    LoginDecryptionOptionsComponent,
    LoginWithWebauthnComponent,
  ],
})
export class LoginModule {}

import { NgModule } from "@angular/core";

import { CheckboxModule } from "@bitwarden/components";

import { SharedModule } from "../../../app/shared";

import { LoginWithDeviceComponent } from "./login-with-device.component";
import { LoginWithWebauthnComponent } from "./login-with-webauthn.component";
import { LoginComponent } from "./login.component";

@NgModule({
  imports: [SharedModule, CheckboxModule],
  declarations: [LoginComponent, LoginWithDeviceComponent, LoginWithWebauthnComponent],
  exports: [LoginComponent, LoginWithDeviceComponent, LoginWithWebauthnComponent],
})
export class LoginModule {}

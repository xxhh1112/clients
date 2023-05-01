import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import { SharedModule } from "../../app/shared/shared.module";

import { LoginWithDeviceComponent } from "./login-with-device.component";
import { LoginComponent } from "./login.component";
import { EnvironmentSelectorComponent } from "../../app/components/environment-selector.component";

@NgModule({
  imports: [SharedModule, RouterModule, EnvironmentSelectorComponent],
  declarations: [LoginComponent, LoginWithDeviceComponent],
  exports: [LoginComponent, LoginWithDeviceComponent],
})
export class LoginModule {}

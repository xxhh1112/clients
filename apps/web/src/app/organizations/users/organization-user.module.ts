import { ScrollingModule } from "@angular/cdk/scrolling";
import { NgModule } from "@angular/core";

import { ComponentsModule } from "../../components/components.module";
import { SharedModule } from "../../shared.module";

import { EnrollMasterPasswordReset } from "./enroll-master-password-reset.component";

@NgModule({
  imports: [SharedModule, ScrollingModule, ComponentsModule],
  declarations: [EnrollMasterPasswordReset],
  exports: [EnrollMasterPasswordReset],
})
export class OrganizationUserModule {}

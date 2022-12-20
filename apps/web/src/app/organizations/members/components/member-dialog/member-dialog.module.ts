import { NgModule } from "@angular/core";

import { SharedOrganizationModule } from "../../../shared";

import { MemberDialogComponent } from "./member-dialog.component";
import { NestedCheckboxComponent } from "./nested-checkbox.component";

@NgModule({
  declarations: [MemberDialogComponent, NestedCheckboxComponent],
  imports: [SharedOrganizationModule],
  exports: [MemberDialogComponent],
})
export class UserDialogModule {}

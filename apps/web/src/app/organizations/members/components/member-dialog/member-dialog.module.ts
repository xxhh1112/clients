import { NgModule } from "@angular/core";

import { SharedModule } from "../../../../shared/shared.module";

import { MemberDialogComponent } from "./member-dialog.component";
import { NestedCheckboxComponent } from "./nested-checkbox.component";

@NgModule({
  declarations: [MemberDialogComponent, NestedCheckboxComponent],
  imports: [SharedModule],
  exports: [MemberDialogComponent],
})
export class UserDialogModule {}

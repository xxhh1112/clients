import { ScrollingModule } from "@angular/cdk/scrolling";
import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared";

import { EntityUsersComponent } from "./entity-users.component";
import { UserDialogModule } from "./member-dialog";

@NgModule({
  imports: [SharedModule, ScrollingModule, UserDialogModule],
  declarations: [EntityUsersComponent],
  exports: [EntityUsersComponent],
})
export class OrganizationManageModule {}

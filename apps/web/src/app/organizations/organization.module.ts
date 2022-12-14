import { NgModule } from "@angular/core";

import { CoreOrganizationModule } from "./core";
import { GroupAddEditComponent } from "./manage/group-add-edit.component";
import { GroupsComponent } from "./manage/groups.component";
import { OrganizationsRoutingModule } from "./organization-routing.module";
import { SharedOrganizationModule } from "./shared";

@NgModule({
  imports: [SharedOrganizationModule, CoreOrganizationModule, OrganizationsRoutingModule],
  declarations: [GroupsComponent, GroupAddEditComponent],
})
export class OrganizationModule {}

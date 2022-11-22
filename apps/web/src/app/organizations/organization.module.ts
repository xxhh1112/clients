import { NgModule } from "@angular/core";

import { ApiService as ApiServiceAbstraction } from "@bitwarden/common/abstractions/api.service";

import { SharedModule } from "../shared/shared.module";

import { CoreOrganizationModule } from "./core";
import { GroupAddEditComponent } from "./manage/group-add-edit.component";
import { GroupsComponent } from "./manage/groups.component";
import { UserGroupsComponent } from "./manage/user-groups.component";
import { OrganizationsRoutingModule } from "./organization-routing.module";
import { GroupServiceAbstraction } from "./services/abstractions/group";
import { GroupService } from "./services/group/group.service";
import { SharedOrganizationModule } from "./shared";
import { AccessSelectorModule } from "./shared/components/access-selector";

@NgModule({
  imports: [
    SharedModule,
    OrganizationsRoutingModule,
    SharedOrganizationModule,
    CoreOrganizationModule,
    SharedModule,
    AccessSelectorModule,
    OrganizationsRoutingModule,
  ],
  declarations: [GroupsComponent, GroupAddEditComponent, UserGroupsComponent],
  providers: [
    {
      provide: GroupServiceAbstraction,
      useClass: GroupService,
      deps: [ApiServiceAbstraction],
    },
  ],
})
export class OrganizationModule {}

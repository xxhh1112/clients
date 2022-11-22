import { NgModule } from "@angular/core";

import { ApiService as ApiServiceAbstraction } from "@bitwarden/common/abstractions/api.service";

import { SharedModule } from "../shared";

import { AccessSelectorModule } from "./components/access-selector";
import { CollectionAddEditComponent } from "./manage/collection-add-edit.component";
import { GroupAddEditComponent } from "./manage/group-add-edit.component";
import { GroupsComponent } from "./manage/groups.component";
import { UserGroupsComponent } from "./manage/user-groups.component";
import { OrganizationsRoutingModule } from "./organization-routing.module";
import { GroupServiceAbstraction } from "./services/abstractions/group";
import { GroupService } from "./services/group/group.service";

@NgModule({
  imports: [SharedModule, AccessSelectorModule, OrganizationsRoutingModule],
  declarations: [
    GroupsComponent,
    GroupAddEditComponent,
    CollectionAddEditComponent,
    UserGroupsComponent,
  ],
  providers: [
    {
      provide: GroupServiceAbstraction,
      useClass: GroupService,
      deps: [ApiServiceAbstraction],
    },
  ],
})
export class OrganizationModule {}

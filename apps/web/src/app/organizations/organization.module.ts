import { NgModule } from "@angular/core";

import { SharedModule } from "../shared";

import { OrganizationsRoutingModule } from "./organization-routing.module";
import { SharedOrganizationModule } from "./shared";

@NgModule({
  imports: [SharedModule, OrganizationsRoutingModule, SharedOrganizationModule],
})
export class OrganizationModule {}

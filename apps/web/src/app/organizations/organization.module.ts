import { NgModule } from "@angular/core";

import { SharedModule } from "../shared";

import { AccessSelectorModule } from "./components/access-selector";
import { OrganizationsRoutingModule } from "./organization-routing.module";
import { SharedOrganizationModule } from "./shared";

@NgModule({
  imports: [
    SharedModule,
    OrganizationsRoutingModule,
    SharedOrganizationModule,
    AccessSelectorModule,
  ],
})
export class OrganizationModule {}

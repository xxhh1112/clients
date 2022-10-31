import { NgModule } from "@angular/core";

import { SharedModule } from "../shared";

import { CoreOrganizationModule } from "./core";
import { OrganizationsRoutingModule } from "./organization-routing.module";
import { SharedOrganizationModule } from "./shared";

@NgModule({
  imports: [
    SharedModule,
    OrganizationsRoutingModule,
    SharedOrganizationModule,
    CoreOrganizationModule,
  ],
})
export class OrganizationModule {}

import { NgModule } from "@angular/core";

import { SharedModule } from "../shared";

import { AccessSelectorModule } from "./components/access-selector";
import { CollectionDialogModule } from "./components/collection-dialog";
import { OrganizationsRoutingModule } from "./organization-routing.module";
import { SharedOrganizationModule } from "./shared";

@NgModule({
  imports: [
    SharedModule,
    AccessSelectorModule,
    CollectionDialogModule,
    OrganizationsRoutingModule,
    SharedOrganizationModule,
  ],
})
export class OrganizationModule {}

import { NgModule } from "@angular/core";

import { SharedModule } from "../shared";

import { AccessSelectorModule } from "./components/access-selector";
import { CollectionDialogModule } from "./components/collection-dialog";
import { OrganizationsRoutingModule } from "./organization-routing.module";

@NgModule({
  imports: [SharedModule, AccessSelectorModule, CollectionDialogModule, OrganizationsRoutingModule],
})
export class OrganizationModule {}

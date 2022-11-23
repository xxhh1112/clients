import { NgModule } from "@angular/core";

import { AccessSelectorModule } from "./components/access-selector";
import { CollectionDialogModule } from "./components/collection-dialog";

@NgModule({
  imports: [CollectionDialogModule, AccessSelectorModule],
  exports: [CollectionDialogModule, AccessSelectorModule],
})
export class SharedOrganizationModule {}

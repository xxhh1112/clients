import { NgModule } from "@angular/core";

import { CollectionDialogModule } from "./components/collection-dialog";

@NgModule({
  imports: [CollectionDialogModule],
  exports: [CollectionDialogModule],
})
export class SharedOrganizationModule {}

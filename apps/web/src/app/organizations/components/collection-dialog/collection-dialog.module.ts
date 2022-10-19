import { NgModule } from "@angular/core";

import { SharedModule } from "../../../shared";

import { CollectionDialogComponent } from "./collection-dialog.component";

@NgModule({
  imports: [SharedModule],
  declarations: [CollectionDialogComponent],
  exports: [CollectionDialogComponent],
})
export class CollectionDialogModule {}

import { NgModule } from "@angular/core";

import { SharedModule } from "@bitwarden/web-vault/app/shared";

import { BulkStatusDialogComponent } from "../layout/dialogs/bulk-status-dialog.component";
import { FilterComponent } from "../layout/filter.component";
import { HeaderComponent } from "../layout/header.component";
import { NewMenuComponent } from "../layout/new-menu.component";
import { NoItemsComponent } from "../layout/no-items.component";

@NgModule({
  imports: [SharedModule],
  exports: [
    HeaderComponent,
    FilterComponent,
    NewMenuComponent,
    NoItemsComponent,
    BulkStatusDialogComponent,
    SharedModule,
  ],
  declarations: [
    BulkStatusDialogComponent,
    HeaderComponent,
    FilterComponent,
    NewMenuComponent,
    NoItemsComponent,
  ],
  providers: [],
  bootstrap: [],
})
export class SecretsSharedModule {}

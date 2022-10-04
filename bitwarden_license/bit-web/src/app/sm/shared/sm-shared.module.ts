import { NgModule } from "@angular/core";

import { SharedModule } from "@bitwarden/web-vault/app/shared";

import { FilterComponent } from "../layout/filter.component";
import { HeaderComponent } from "../layout/header.component";
import { NewMenuComponent } from "../layout/new-menu.component";
import { NoItemsComponent } from "../layout/no-items.component";

@NgModule({
  imports: [SharedModule],
  exports: [HeaderComponent, FilterComponent, NewMenuComponent, NoItemsComponent, SharedModule],
  declarations: [HeaderComponent, FilterComponent, NewMenuComponent, NoItemsComponent],
  providers: [],
  bootstrap: [],
})
export class SecretsSharedModule {}

import { NgModule } from "@angular/core";

import { SharedModule, LooseComponentsModule } from "../shared";

import { OrganizationBadgeModule } from "./organization-badge/organization-badge.module";
import { PipesModule } from "./pipes/pipes.module";
import { VaultFilterModule } from "./vault-filter/vault-filter.module";
import { VaultItemsComponent } from "./vault-items.component";
import { VaultRoutingModule } from "./vault-routing.module";
import { VaultComponent } from "./vault.component";

@NgModule({
  imports: [
    VaultFilterModule,
    VaultRoutingModule,
    OrganizationBadgeModule,
    PipesModule,
    SharedModule,
    LooseComponentsModule,
  ],
  declarations: [VaultComponent, VaultItemsComponent],
  exports: [VaultComponent],
})
export class VaultModule {}

import { NgModule } from "@angular/core";

import { SharedModule , LooseComponentsModule } from "../shared";

import { CiphersComponent } from "./ciphers.component";
import { OrganizationBadgeModule } from "./organization-badge/organization-badge.module";
import { PipesModule } from "./pipes/pipes.module";
import { VaultFilterModule } from "./vault-filter/vault-filter.module";
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
  declarations: [VaultComponent, CiphersComponent],
  exports: [VaultComponent],
})
export class VaultModule {}

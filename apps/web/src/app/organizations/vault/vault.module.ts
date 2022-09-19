import { NgModule } from "@angular/core";

import { VaultSharedModule } from "../../vault/shared/vault-shared.module";

import { CiphersComponent } from "./ciphers.component";
import { CollectionBadgeModule } from "./collection-badge/collection-badge.module";
import { GroupBadgeModule } from "./group-badge/group-badge.module";
import { VaultFilterModule } from "./vault-filter/vault-filter.module";
import { VaultRoutingModule } from "./vault-routing.module";
import { VaultComponent } from "./vault.component";

@NgModule({
  imports: [
    VaultSharedModule,
    VaultRoutingModule,
    VaultFilterModule,
    CollectionBadgeModule,
    GroupBadgeModule,
  ],
  declarations: [VaultComponent, CiphersComponent],
  exports: [VaultComponent],
})
export class VaultModule {}

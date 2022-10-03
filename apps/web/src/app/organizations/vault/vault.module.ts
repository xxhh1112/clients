import { NgModule } from "@angular/core";

import { LooseComponentsModule } from "../../shared/loose-components.module";
import { SharedModule } from "../../shared/shared.module";

import { CiphersComponent } from "./ciphers.component";
import { VaultFilterModule } from "./vault-filter/vault-filter.module";
import { VaultRoutingModule } from "./vault-routing.module";
import { VaultComponent } from "./vault.component";

@NgModule({
  imports: [VaultRoutingModule, VaultFilterModule, SharedModule, LooseComponentsModule],
  declarations: [VaultComponent, CiphersComponent],
  exports: [VaultComponent],
})
export class VaultModule {}

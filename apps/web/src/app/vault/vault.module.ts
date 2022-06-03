import { NgModule } from "@angular/core";

import { ComponentsModule } from "../components/components.module";
import { SharedModule } from "../shared.module";
import { VaultFilterModule } from "../vault-filter/vault-filter.module";

import { VaultService } from "./vault.service";

@NgModule({
  imports: [SharedModule, VaultFilterModule, ComponentsModule],
  exports: [SharedModule, VaultFilterModule, ComponentsModule],
  providers: [
    {
      provide: VaultService,
      useClass: VaultService,
    },
  ],
})
export class VaultModule {}

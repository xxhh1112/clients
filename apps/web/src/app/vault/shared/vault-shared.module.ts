import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared";
import { LooseComponentsModule } from "../../shared/loose-components.module";
import { VaultFilterModule } from "../vault-filter/vault-filter.module";

import { PipesModule } from "./pipes/pipes.module";

@NgModule({
  imports: [SharedModule, VaultFilterModule, LooseComponentsModule, PipesModule],
  exports: [SharedModule, VaultFilterModule, LooseComponentsModule, PipesModule],
})
export class VaultSharedModule {}

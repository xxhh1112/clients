import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import { VaultFilterComponent } from "./vault-filter.component";

@NgModule({
  declarations: [VaultFilterComponent],
  imports: [CommonModule, RouterModule],
  exports: [VaultFilterComponent],
})
export class VaultFilterModule {}

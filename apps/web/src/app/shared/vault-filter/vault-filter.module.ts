import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import { CipherFilterPipe } from "./cipher-filter.pipe";
import { VaultFilterComponent } from "./vault-filter.component";

@NgModule({
  declarations: [VaultFilterComponent, CipherFilterPipe],
  imports: [CommonModule, RouterModule],
  exports: [VaultFilterComponent, CipherFilterPipe],
})
export class VaultFilterModule {}

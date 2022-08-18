import { NgModule } from "@angular/core";

import { SharedModule } from "../../../shared";

import { FilterSectionComponent } from "./vault-filter-section.component";
import { VaultFilterService } from "./vault-filter.service";

@NgModule({
  imports: [SharedModule],
  declarations: [FilterSectionComponent],
  exports: [SharedModule, FilterSectionComponent],
  providers: [VaultFilterService],
})
export class VaultFilterSharedModule {}

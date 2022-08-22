import { NgModule } from "@angular/core";

import { SharedModule } from "../../../shared";

import { FilterSectionComponent } from "./vault-filter-section.component";

@NgModule({
  imports: [SharedModule],
  declarations: [FilterSectionComponent],
  exports: [SharedModule, FilterSectionComponent],
})
export class VaultFilterSharedModule {}

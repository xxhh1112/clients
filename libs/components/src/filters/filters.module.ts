import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { FilterItemComponent } from "./filter-item.component";
import { FiltersComponent } from "./filters.component";
import { RecursiveFilterItem } from "./recursive-filter-item.component";

@NgModule({
  imports: [CommonModule],
  declarations: [FiltersComponent, FilterItemComponent, RecursiveFilterItem],
  exports: [FiltersComponent],
})
export class FiltersModule {}

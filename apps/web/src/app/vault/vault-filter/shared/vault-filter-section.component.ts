import { Component } from "@angular/core";

import { FilterSectionComponent as BaseFilterSectionComponent } from "@bitwarden/angular/vault/vault-filter/components/filter-section.component";

@Component({
  selector: "app-filter-section",
  templateUrl: "vault-filter-section.component.html",
})
export class FilterSectionComponent extends BaseFilterSectionComponent {}

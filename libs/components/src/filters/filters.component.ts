import { Component, Input } from "@angular/core";

import { Item } from "./item.model";

@Component({
  selector: "bit-filters",
  templateUrl: "filters.component.html",
})
export class FiltersComponent {
  @Input() collections: Item[];
  @Input() folders: Item[];
}

import { Component, Input } from "@angular/core";

import { Item } from "./item.model";

@Component({
  selector: `bit-recursive-filter-item`,
  template: `
    <bit-filter-item [name]="item.name">
      <bit-recursive-filter-item
        *ngFor="let child of item.children"
        [item]="child"
      ></bit-recursive-filter-item>
    </bit-filter-item>
  `,
})
export class RecursiveFilterItem {
  @Input() item: Item;
}

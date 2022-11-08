import { Component, Input } from "@angular/core";

import { Item } from "./item.model";

@Component({
  selector: `bit-side-menu-recursive-item`,
  template: `
    <bit-side-menu-item [item]="item">
      <bit-side-menu-recursive-item
        *ngFor="let child of item.children"
        [item]="child"
      ></bit-side-menu-recursive-item>
    </bit-side-menu-item>
  `,
})
export class SideMenuRecursiveItem {
  @Input() item: Item;
}

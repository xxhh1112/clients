import { Component, Input } from "@angular/core";

import { Item } from "./item.model";

@Component({
  selector: "bit-side-menu",
  templateUrl: "side-menu.component.html",
})
export class SideMenuComponent {
  @Input() collections: Item[];
  @Input() folders: Item[];
}

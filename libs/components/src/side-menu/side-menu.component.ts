import { Component, Input } from "@angular/core";

import { Item } from "./item.model";
import { Organization } from "./organization.model";

@Component({
  selector: "bit-side-menu",
  templateUrl: "side-menu.component.html",
})
export class SideMenuComponent {
  @Input() organizations: Organization[];
  @Input() collections: Item[];
  @Input() folders: Item[];
}

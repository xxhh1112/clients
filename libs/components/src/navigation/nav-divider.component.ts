import { Component } from "@angular/core";

import { SidebarService } from "../layout/sidebar.service";

@Component({
  selector: "bit-nav-divider",
  templateUrl: "./nav-divider.component.html",
})
export class NavDividerComponent {
  constructor(protected sidebarService: SidebarService) {}
}

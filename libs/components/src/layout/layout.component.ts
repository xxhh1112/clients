import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

import { NavigationModule } from "../navigation";

import { SidebarService } from "./sidebar.service";

@Component({
  selector: "bit-layout",
  templateUrl: "layout.component.html",
  standalone: true,
  imports: [CommonModule, NavigationModule],
})
export class LayoutComponent {
  constructor(protected sidebarService: SidebarService) {}
}

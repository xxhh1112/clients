import { Component } from "@angular/core";

import { SideNavService } from "./side-nav.service";

@Component({
  selector: "bit-side-nav",
  templateUrl: "./side-nav.component.html",
})
export class SideNavComponent {
  constructor(protected sideNavService: SideNavService) {}
}

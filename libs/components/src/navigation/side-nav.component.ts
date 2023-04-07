import { Component } from "@angular/core";

import { SideNavService } from "./side-nav.service";

@Component({
  selector: "bit-side-nav",
  templateUrl: "./side-nav.component.html",
})
export class SideNavComponent {
  protected expanded$ = this.sideNavService.expanded$;

  constructor(protected sideNavService: SideNavService) {}
}

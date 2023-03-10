import { Component, OnInit } from "@angular/core";

import { SideNavService } from "@bitwarden/components/src/navigation/side-nav.service";

@Component({
  selector: "sm-layout",
  templateUrl: "./layout.component.html",
})
export class LayoutComponent implements OnInit {
  ngOnInit() {
    document.body.classList.remove("layout_frontend");
  }

  constructor(protected sideNavService: SideNavService) {}
}

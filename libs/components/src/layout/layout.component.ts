import { Component, OnInit } from "@angular/core";

import { SideNavService } from "../navigation/side-nav.service";

@Component({
  selector: "bit-layout",
  templateUrl: "./layout.component.html",
})
export class LayoutComponent implements OnInit {
  ngOnInit() {
    document.body.classList.remove("layout_frontend");
  }

  constructor(protected sideNavService: SideNavService) {}
}

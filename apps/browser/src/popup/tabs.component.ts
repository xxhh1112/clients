import { Component, OnInit } from "@angular/core";

import BrowserPopupUtils from "../platform/popup/browser-popup-utils";

import { PopupCloseWarningService } from "./services/popup-close-warning.service";

@Component({
  selector: "app-tabs",
  templateUrl: "tabs.component.html",
})
export class TabsComponent implements OnInit {
  showCurrentTab = true;

  constructor(private popupUtilsService: PopupCloseWarningService) {}

  ngOnInit() {
    this.showCurrentTab = !BrowserPopupUtils.inPopout(window);
  }
}

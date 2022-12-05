import { Component, HostListener } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import {
  BrowserFido2Message,
  BrowserFido2UserInterfaceService,
} from "../../services/fido2/browser-fido2-user-interface.service";

@Component({
  selector: "app-fido2",
  templateUrl: "fido2.component.html",
  styleUrls: [],
})
export class Fido2Component {
  constructor(private activatedRoute: ActivatedRoute) {}

  get data() {
    return this.activatedRoute.snapshot.queryParams as BrowserFido2Message;
  }

  async verify() {
    const data = this.data;
    BrowserFido2UserInterfaceService.sendMessage({
      requestId: data.requestId,
      type: "VerifyUserResponse",
    });
    window.close();
  }

  @HostListener("window:unload")
  unloadHandler() {
    const data = this.data;
    BrowserFido2UserInterfaceService.sendMessage({
      requestId: data.requestId,
      type: "RequestCancelled",
    });
  }
}

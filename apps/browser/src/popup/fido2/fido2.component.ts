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

  async accept() {
    const data = this.data;

    if (data.type === "VerifyUserRequest") {
      BrowserFido2UserInterfaceService.sendMessage({
        requestId: data.requestId,
        type: "VerifyUserResponse",
      });
    } else if (data.type === "ConfirmNewCredentialRequest") {
      BrowserFido2UserInterfaceService.sendMessage({
        requestId: data.requestId,
        type: "ConfirmNewCredentialResponse",
      });
    } else {
      BrowserFido2UserInterfaceService.sendMessage({
        requestId: data.requestId,
        type: "RequestCancelled",
      });
    }

    window.close();
  }

  cancel() {
    this.unload();
    window.close();
  }

  @HostListener("window:unload")
  unload() {
    const data = this.data;
    BrowserFido2UserInterfaceService.sendMessage({
      requestId: data.requestId,
      type: "RequestCancelled",
    });
  }
}

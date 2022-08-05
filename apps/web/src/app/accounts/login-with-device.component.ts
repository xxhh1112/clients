import { Component, OnInit } from "@angular/core";

import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";

@Component({
  selector: "app-login-with-device",
  templateUrl: "login-with-device.component.html",
})
export class LoginWithDeviceComponent implements OnInit {
  fingerPrint: string;

  constructor(private cryptoService: CryptoService, private stateService: StateService) {}

  async ngOnInit() {
    // const fingerPrint = await this.cryptoService.getFingerprint(
    //   await this.stateService.getUserId()
    // );
    // if (fingerPrint) {
    //   this.fingerPrint = fingerPrint.join("-");
    // }
    this.fingerPrint = "longinus-spear-black-moon-scrolls";
  }
}

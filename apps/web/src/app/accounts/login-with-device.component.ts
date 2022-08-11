import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { CryptoFunctionService } from "@bitwarden/common/abstractions/cryptoFunction.service";

@Component({
  selector: "app-login-with-device",
  templateUrl: "login-with-device.component.html",
})
export class LoginWithDeviceComponent implements OnInit {
  fingerPrint: string;
  email: string;

  constructor(
    private router: Router,
    private cryptoService: CryptoService,
    private cryptoFunctionService: CryptoFunctionService
  ) {
    const navigation = this.router.getCurrentNavigation();
    this.email = navigation.extras?.state?.email;
  }

  async ngOnInit() {
    if (!this.email) {
      this.router.navigate(["/login"]);
    }

    this.startPasswordlessLogin();
  }

  async startPasswordlessLogin() {
    const keypair = await this.cryptoFunctionService.rsaGenerateKeyPair(2048);
    const fingerprint = await this.cryptoService.getFingerprint(this.email, keypair[0]);
    this.fingerPrint = fingerprint.join("-");
  }
}

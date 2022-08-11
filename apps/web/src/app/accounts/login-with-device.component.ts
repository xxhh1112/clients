import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { CryptoFunctionService } from "@bitwarden/common/abstractions/cryptoFunction.service";
import { PasswordGenerationService } from "@bitwarden/common/abstractions/passwordGeneration.service";
import { AuthRequestType } from "@bitwarden/common/enums/authRequestType";
import { Utils } from "@bitwarden/common/misc/utils";
import { PasswordlessCreateAuthRequest } from "@bitwarden/common/src/models/request/passwordlessCreateAuthRequest";
import { AppIdService } from "@bitwarden/common/src/services/appId.service";

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
    private cryptoFunctionService: CryptoFunctionService,
    private appIdService: AppIdService,
    private PasswordGenerationService: PasswordGenerationService,
    private apiService: ApiService
  ) {
    const navigation = this.router.getCurrentNavigation();

    if (navigation) {
      this.email = navigation.extras?.state?.email;
    }
  }

  async ngOnInit() {
    if (!this.email) {
      this.router.navigate(["/login"]);
    }

    this.startPasswordlessLogin();
  }

  async startPasswordlessLogin() {
    const keypair = await this.cryptoFunctionService.rsaGenerateKeyPair(2048);
    const fingerprint = await (
      await this.cryptoService.getFingerprint(this.email, keypair[0])
    ).join("-");
    const deviceIdentifier = await this.appIdService.getAppId();
    const publicKey = Utils.fromBufferToB64(keypair[0]);
    const accessCode = await this.PasswordGenerationService.generatePassword({ length: 25 });

    const request = new PasswordlessCreateAuthRequest(
      this.email,
      deviceIdentifier,
      publicKey,
      AuthRequestType.AuthenticateAndUnlock,
      accessCode,
      fingerprint
    );

    this.fingerPrint = fingerprint;

    await this.apiService.postAuthRequest(request);
  }
}

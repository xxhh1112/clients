import { Directive, OnInit } from "@angular/core";

import { KeyConnectorService } from "@bitwarden/common/auth/abstractions/key-connector.service";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";

import { ModalRef } from "./modal/modal.ref";

@Directive()
export class SetPinComponent implements OnInit {
  pin = "";
  showPin = false;
  masterPassOnRestart = true;
  showMasterPassOnRestart = true;

  constructor(
    private modalRef: ModalRef,
    private cryptoService: CryptoService,
    private keyConnectorService: KeyConnectorService,
    private stateService: StateService
  ) {}

  async ngOnInit() {
    this.showMasterPassOnRestart = this.masterPassOnRestart =
      !(await this.keyConnectorService.getUsesKeyConnector());
  }

  toggleVisibility() {
    this.showPin = !this.showPin;
  }

  async submit() {
    if (Utils.isNullOrWhitespace(this.pin)) {
      this.modalRef.close(false);
    }

    const pinKey = await this.cryptoService.makePinKey(
      this.pin,
      await this.stateService.getEmail(),
      await this.stateService.getKdfType(),
      await this.stateService.getKdfConfig()
    );
    const userKey = await this.cryptoService.getUserKeyFromMemory();
    const pinProtectedKey = await this.cryptoService.encrypt(userKey.key, pinKey);
    const encPin = await this.cryptoService.encrypt(this.pin, userKey);
    await this.stateService.setProtectedPin(encPin.encryptedString);
    if (this.masterPassOnRestart) {
      await this.stateService.setUserSymKeyPinEphemeral(pinProtectedKey);
    } else {
      await this.stateService.setUserSymKeyPin(pinProtectedKey);
    }
    await this.cryptoService.clearOldPinKeys();

    this.modalRef.close(true);
  }
}

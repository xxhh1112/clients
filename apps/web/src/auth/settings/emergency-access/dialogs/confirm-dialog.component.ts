import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, Input, OnInit } from "@angular/core";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { Utils } from "@bitwarden/common/misc/utils";

export type ConfirmData = {
  name: string;
  userId: string;
  emergencyAccessId: string;
};

@Component({
  templateUrl: "confirm-dialog.component.html",
})
export class ConfirmDialogComponent implements OnInit {
  protected name: string;
  protected userId: string;
  protected emergencyAccessId: string;

  @Input() formPromise: Promise<any>;

  dontAskAgain = false;
  loading = true;
  fingerprint: string;

  constructor(
    @Inject(DIALOG_DATA) private data: ConfirmData,
    private dialogRef: DialogRef<boolean>,
    private apiService: ApiService,
    private cryptoService: CryptoService,
    private stateService: StateService,
    private logService: LogService
  ) {}

  async ngOnInit() {
    this.name = this.data.name;
    this.userId = this.data.userId;
    this.emergencyAccessId = this.data.emergencyAccessId;

    try {
      const publicKeyResponse = await this.apiService.getUserPublicKey(this.userId);
      if (publicKeyResponse != null) {
        const publicKey = Utils.fromB64ToArray(publicKeyResponse.publicKey);
        const fingerprint = await this.cryptoService.getFingerprint(this.userId, publicKey.buffer);
        if (fingerprint != null) {
          this.fingerprint = fingerprint.join("-");
        }
      }
    } catch (e) {
      this.logService.error(e);
    }
    this.loading = false;
  }

  async submit() {
    if (this.loading) {
      return;
    }

    if (this.dontAskAgain) {
      await this.stateService.setAutoConfirmFingerprints(true);
    }

    try {
      this.dialogRef.close(true);
    } catch (e) {
      this.logService.error(e);
    }
  }
}

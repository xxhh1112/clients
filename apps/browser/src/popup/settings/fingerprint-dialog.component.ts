import { DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import {
  AsyncActionsModule,
  ButtonModule,
  DialogModule,
  DialogService,
} from "@bitwarden/components";

export type FingerprintDialogData = {
  fingerprint: string;
};

@Component({
  templateUrl: "fingerprint-dialog.component.html",
  standalone: true,
  imports: [JslibModule, ButtonModule, DialogModule, AsyncActionsModule],
})
export class FingerprintDialogComponent {
  constructor(
    @Inject(DIALOG_DATA) protected data: FingerprintDialogData,
    private cryptoService: CryptoService,
    private stateService: StateService
  ) {}

  static open(dialogService: DialogService, data: FingerprintDialogData) {
    return dialogService.open(FingerprintDialogComponent, { data });
  }
}

import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";

import { LogService } from "@bitwarden/common/abstractions/log.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";

import { EmergencyAccessService } from "../emergency-access.service";

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

  protected dontAskAgain = false;
  protected loading = true;
  protected fingerprint: string;

  constructor(
    @Inject(DIALOG_DATA) private data: ConfirmData,
    private dialogRef: DialogRef<boolean>,
    private stateService: StateService,
    private logService: LogService,
    private emergencyAccessService: EmergencyAccessService
  ) {}

  async ngOnInit() {
    this.name = this.data.name;
    const userId = this.data.userId;

    try {
      this.fingerprint = await this.emergencyAccessService.getFingerprintForUser(userId);
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

    this.dialogRef.close(true);
  }
}

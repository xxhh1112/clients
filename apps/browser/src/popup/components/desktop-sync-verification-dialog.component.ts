import { DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import {
  AsyncActionsModule,
  ButtonModule,
  DialogModule,
  DialogService,
} from "@bitwarden/components";

export type DesktopSyncVerificationDialogParams = {
  fingerprint: string;
};

@Component({
  templateUrl: "desktop-sync-verification-dialog.component.html",
  standalone: true,
  imports: [JslibModule, ButtonModule, DialogModule, AsyncActionsModule],
})
export class DesktopSyncVerificationDialogComponent {
  constructor(@Inject(DIALOG_DATA) protected params: DesktopSyncVerificationDialogParams) {}

  static open(dialogService: DialogService, data: DesktopSyncVerificationDialogParams) {
    return dialogService.open(DesktopSyncVerificationDialogComponent, {
      data,
    });
  }
}

import { Component } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import {
  AsyncActionsModule,
  ButtonModule,
  DialogModule,
  DialogService,
} from "@bitwarden/components";

@Component({
  templateUrl: "await-desktop-dialog.component.html",
  standalone: true,
  imports: [JslibModule, ButtonModule, DialogModule, AsyncActionsModule],
})
export class AwaitDesktopDialogComponent {
  static open(dialogService: DialogService) {
    return dialogService.open<boolean>(AwaitDesktopDialogComponent, {
      disableClose: true,
    });
  }
}

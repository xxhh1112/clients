import { Component, EventEmitter, Input, Output } from "@angular/core";

import { Verification } from "@bitwarden/common/types/verification";

@Component({
  selector: "app-two-factor-dialog",
  templateUrl: "two-factor-dialog.component.html",
})
export class TwoFactorDialogComponent {
  @Input() secret: Verification;
  @Output() secretChange = new EventEmitter<Verification>();

  @Input() title: string;
  @Input() authed: boolean;
}

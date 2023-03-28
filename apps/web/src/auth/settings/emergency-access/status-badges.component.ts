import { Component, Input } from "@angular/core";

import { EmergencyAccessStatusType } from "@bitwarden/common/auth/enums/emergency-access-status-type";

@Component({
  selector: "app-emergency-access-status-badges",
  templateUrl: "status-badges.component.html",
})
export class StatusBadgeComponent {
  protected emergencyAccessStatusType = EmergencyAccessStatusType;

  @Input() status: EmergencyAccessStatusType;
}

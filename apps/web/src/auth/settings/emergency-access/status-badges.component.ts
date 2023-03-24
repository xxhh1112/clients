import { Component, Input } from "@angular/core";

import { EmergencyAccessStatusType } from "@bitwarden/common/auth/enums/emergency-access-status-type";
import { EmergencyAccessType } from "@bitwarden/common/auth/enums/emergency-access-type";

@Component({
  selector: "app-emergency-access-status-badges",
  templateUrl: "status-badges.component.html",
})
export class StatusBadgeComponent {
  protected emergencyAccessStatusType = EmergencyAccessStatusType;
  protected emergencyAccessType = EmergencyAccessType;

  @Input() status: EmergencyAccessStatusType;
  @Input() type: EmergencyAccessType;
}

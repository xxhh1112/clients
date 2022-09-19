import { Component, Input } from "@angular/core";

import { SelectionReadOnlyRequest } from "@bitwarden/common/models/request/selectionReadOnlyRequest";
import { GroupResponse } from "@bitwarden/common/models/response/groupResponse";

@Component({
  selector: "app-group-badge",
  templateUrl: "group-name-badge.component.html",
})
export class GroupNameBadgeComponent {
  @Input() selectedGroups: SelectionReadOnlyRequest[];
  @Input() allGroups: GroupResponse[];

  get shownGroups(): SelectionReadOnlyRequest[] {
    return this.showXMore ? this.selectedGroups.slice(0, 2) : this.selectedGroups;
  }

  get showXMore(): boolean {
    return this.selectedGroups.length > 3;
  }

  get xMoreCount(): number {
    return this.selectedGroups.length - 2;
  }
}

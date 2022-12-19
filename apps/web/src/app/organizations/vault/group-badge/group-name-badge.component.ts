import { Component, Input } from "@angular/core";

import { SelectionReadOnlyRequest } from "@bitwarden/common/models/request/selection-read-only.request";

import { GroupView } from "../../core";

@Component({
  selector: "app-group-badge",
  templateUrl: "group-name-badge.component.html",
})
export class GroupNameBadgeComponent {
  @Input() selectedGroups: SelectionReadOnlyRequest[];
  @Input() allGroups: GroupView[];

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

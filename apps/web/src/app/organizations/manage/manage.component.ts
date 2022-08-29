import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { concatMap, Subject, takeUntil } from "rxjs";

import { OrganizationService } from "@bitwarden/common/abstractions/organization.service";
import { Organization } from "@bitwarden/common/models/domain/organization";

@Component({
  selector: "app-org-manage",
  templateUrl: "manage.component.html",
})
export class ManageComponent implements OnInit, OnDestroy {
  organization: Organization;

  private destroy$ = new Subject<void>();

  constructor(private route: ActivatedRoute, private organizationService: OrganizationService) {}

  ngOnInit() {
    this.route.params
      .pipe(
        concatMap(async (params) => {
          this.organization = await this.organizationService.get(params.organizationId);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

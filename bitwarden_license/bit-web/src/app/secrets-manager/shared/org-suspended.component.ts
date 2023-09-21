import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { concatMap, Subject, takeUntil } from "rxjs";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Icon, Icons } from "@bitwarden/components";

@Component({
  templateUrl: "./org-suspended.component.html",
})
export class OrgDisabledComponent implements OnInit {
  constructor(private organizationService: OrganizationService, private route: ActivatedRoute) {}

  protected organizationName: string;
  protected organizationId: string;
  protected NoAccess: Icon = Icons.NoAccess;
  private destroy$ = new Subject<void>();

  async ngOnInit() {
    this.route.params
      .pipe(
        concatMap(async (params) => {
          this.organizationId = params.organizationId;
          this.organizationName = await this.organizationService.get(this.organizationId)?.name;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.organizationName = this.organizationService.get(this.organizationId)?.name;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

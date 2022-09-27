import { Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { concatMap, Subject, takeUntil } from "rxjs";

import { BroadcasterService } from "@bitwarden/common/abstractions/broadcaster.service";
import { OrganizationService } from "@bitwarden/common/abstractions/organization.service";
import { Organization } from "@bitwarden/common/models/domain/organization";

import {
  canAccessBillingTab,
  canAccessGroupsTab,
  canAccessMembersTab,
  canAccessReportingTab,
  canAccessSettingsTab,
} from "../navigation-permissions";

const BroadcasterSubscriptionId = "OrganizationLayoutComponent";

@Component({
  selector: "app-organization-layout",
  templateUrl: "organization-layout.component.html",
})
export class OrganizationLayoutComponent implements OnInit, OnDestroy {
  private organizationId: string;
  private destroy$ = new Subject<void>();

  organization: Organization;

  constructor(
    private route: ActivatedRoute,
    private organizationService: OrganizationService,
    private broadcasterService: BroadcasterService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    document.body.classList.remove("layout_frontend");
    this.route.params
      .pipe(
        concatMap(async (params: any) => {
          this.organizationId = params.organizationId;
          await this.load();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.broadcasterService.subscribe(BroadcasterSubscriptionId, (message: any) => {
      this.ngZone.run(async () => {
        switch (message.command) {
          case "updatedOrgLicense":
            await this.load();
            break;
        }
      });
    });
  }

  ngOnDestroy() {
    this.broadcasterService.unsubscribe(BroadcasterSubscriptionId);
    this.destroy$.next();
    this.destroy$.complete();
  }

  async load() {
    this.organization = await this.organizationService.get(this.organizationId);
  }

  get showSettingsTab(): boolean {
    return canAccessSettingsTab(this.organization);
  }

  get showMembersTab(): boolean {
    return canAccessMembersTab(this.organization);
  }

  get showGroupsTab(): boolean {
    return canAccessGroupsTab(this.organization);
  }

  get showReportsTab(): boolean {
    return canAccessReportingTab(this.organization);
  }

  get showBillingTab(): boolean {
    return canAccessBillingTab(this.organization);
  }

  get reportTabLabel(): string {
    return this.organization.useEvents ? "reporting" : "reports";
  }

  get reportRoute(): string {
    return this.organization.useEvents ? "reporting/events" : "reporting/reports";
  }
}

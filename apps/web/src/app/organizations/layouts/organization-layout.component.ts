import { Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { BroadcasterService } from "@bitwarden/common/abstractions/broadcaster.service";
import { OrganizationService } from "@bitwarden/common/abstractions/organization.service";
import { Organization } from "@bitwarden/common/models/domain/organization";

import { canAccessSettingsTab } from "../navigation-permissions";

const BroadcasterSubscriptionId = "OrganizationLayoutComponent";

@Component({
  selector: "app-organization-layout",
  templateUrl: "organization-layout.component.html",
})
export class OrganizationLayoutComponent implements OnInit, OnDestroy {
  organization: Organization;
  businessTokenPromise: Promise<any>;
  private organizationId: string;

  constructor(
    private route: ActivatedRoute,
    private organizationService: OrganizationService,
    private broadcasterService: BroadcasterService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    document.body.classList.remove("layout_frontend");
    this.route.params.subscribe(async (params: any) => {
      this.organizationId = params.organizationId;
      await this.load();
    });
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
  }

  async load() {
    this.organization = await this.organizationService.get(this.organizationId);
  }

  get showSettingsTab(): boolean {
    return canAccessSettingsTab(this.organization);
  }

  get showMembersTab(): boolean {
    return this.organization.canManageUsers;
  }

  get showGroupsTab(): boolean {
    return this.organization.canManageGroups;
  }

  get showReportsTab(): boolean {
    return this.organization.canAccessReports;
  }

  get showBillingTab(): boolean {
    return this.organization.canManageBilling;
  }

  get reportTabLabel(): string {
    return this.organization.useEvents ? "reporting" : "reports";
  }
}

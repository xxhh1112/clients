import { Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { BroadcasterService } from "@bitwarden/common/abstractions/broadcaster.service";
import { OrganizationService } from "@bitwarden/common/abstractions/organization.service";
import { Organization } from "@bitwarden/common/models/domain/organization";

import { NavigationPermissionsService } from "../services/navigation-permissions.service";

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
    return NavigationPermissionsService.canAccessSettings(this.organization);
  }

  get showMembersTab(): boolean {
    return NavigationPermissionsService.canAccessMembers(this.organization);
  }

  get showGroupsTab(): boolean {
    return (
      this.organization.useGroups && NavigationPermissionsService.canAccessGroups(this.organization)
    );
  }

  get showReportsTab(): boolean {
    return NavigationPermissionsService.canAccessReporting(this.organization);
  }

  get showBillingTab(): boolean {
    return NavigationPermissionsService.canAccessBilling(this.organization);
  }

  get reportTabLabel(): string {
    return this.organization.useEvents ? "reporting" : "reports";
  }
}

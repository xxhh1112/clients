import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { BillingHistoryResponse } from "@bitwarden/common/models/response/billingHistoryResponse";
import { OrganizationApiService } from "@bitwarden/common/services/organization/organization-api.service";

@Component({
  selector: "app-org-billing-history-view",
  templateUrl: "organization-billing-history-view.component.html",
})
// eslint-disable-next-line rxjs-angular/prefer-takeuntil
export class OrgBillingHistoryViewComponent implements OnInit {
  loading = false;
  firstLoaded = false;
  billing: BillingHistoryResponse;
  organizationId: string;

  constructor(private orgApiService: OrganizationApiService, private route: ActivatedRoute) {}

  async ngOnInit() {
    // eslint-disable-next-line rxjs-angular/prefer-takeuntil, rxjs/no-async-subscribe
    this.route.params.subscribe(async (params) => {
      this.organizationId = params.organizationId;
      await this.load();
      this.firstLoaded = true;
    });
  }

  async load() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.billing = await this.orgApiService.getBilling(this.organizationId);
    this.loading = false;
  }
}

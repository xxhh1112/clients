import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { OrganizationApiServiceAbstraction } from "@bitwarden/common/abstractions/organization/organization-api.service.abstraction";
import { BillingHistoryResponse } from "@bitwarden/common/models/response/billingHistoryResponse";

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

  constructor(
    private organizationApiService: OrganizationApiServiceAbstraction,
    private route: ActivatedRoute
  ) {}

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
    this.billing = await this.organizationApiService.getBilling(this.organizationId);
    this.loading = false;
  }
}

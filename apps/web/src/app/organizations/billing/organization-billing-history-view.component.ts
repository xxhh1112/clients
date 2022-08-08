import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { BillingHistoryResponse } from "@bitwarden/common/models/response/billingHistoryResponse";

@Component({
  selector: "app-org-billing-history-view",
  templateUrl: "organization-billing-history-view.component.html",
})
export class OrgBillingHistoryViewComponent implements OnInit {
  loading = false;
  firstLoaded = false;
  billing: BillingHistoryResponse;
  organizationId: string;

  constructor(private apiService: ApiService, private route: ActivatedRoute) {}

  async ngOnInit() {
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
    this.billing = await this.apiService.getOrganizationBilling(this.organizationId);
    this.loading = false;
  }
}

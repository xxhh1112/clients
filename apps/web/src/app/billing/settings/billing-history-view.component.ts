import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { AccountApiService } from "@bitwarden/common/auth/abstractions/account-api.service";
import { BillingHistoryResponse } from "@bitwarden/common/billing/models/response/billing-history.response";

@Component({
  selector: "app-billing-history-view",
  templateUrl: "billing-history-view.component.html",
})
export class BillingHistoryViewComponent implements OnInit {
  loading = false;
  firstLoaded = false;
  billing: BillingHistoryResponse;

  constructor(
    private accountApiService: AccountApiService,
    private platformUtilsService: PlatformUtilsService,
    private router: Router
  ) {}

  async ngOnInit() {
    if (this.platformUtilsService.isSelfHost()) {
      this.router.navigate(["/settings/subscription"]);
      return;
    }
    await this.load();
    this.firstLoaded = true;
  }

  async load() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.billing = await this.accountApiService.getUserBillingHistory();
    this.loading = false;
  }
}

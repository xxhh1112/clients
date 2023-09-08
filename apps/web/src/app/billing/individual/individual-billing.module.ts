import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared";
import { BillingSharedModule } from "../shared/billing-shared.module";

import { BillingHistoryViewComponent } from "./billing-history-view.component";
import { SubscriptionRoutingModule } from "./subscription-routing.module";
import { SubscriptionComponent } from "./subscription.component";

@NgModule({
  imports: [SharedModule, SubscriptionRoutingModule, BillingSharedModule],
  declarations: [SubscriptionComponent, BillingHistoryViewComponent],
  exports: [],
})
export class IndividualBillingModule {}

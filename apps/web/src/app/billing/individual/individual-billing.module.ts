import { NgModule } from "@angular/core";

import { BillingSharedModule } from "../shared";

import { BillingHistoryViewComponent } from "./billing-history-view.component";
import { PremiumComponent } from "./premium.component";
import { SubscriptionRoutingModule } from "./subscription-routing.module";
import { SubscriptionComponent } from "./subscription.component";
import { UserSubscriptionComponent } from "./user-subscription.component";

@NgModule({
  imports: [SubscriptionRoutingModule, BillingSharedModule],
  declarations: [
    SubscriptionComponent,
    BillingHistoryViewComponent,
    UserSubscriptionComponent,
    PremiumComponent,
  ],
})
export class IndividualBillingModule {}

import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared";

import { SubscriptionRoutingModule } from "./subscription-routing.module";
import { SubscriptionComponent } from "./subscription.component";

@NgModule({
  imports: [SharedModule, SubscriptionRoutingModule],
  declarations: [SubscriptionComponent],
  exports: [],
})
export class BillingSharedModule {}

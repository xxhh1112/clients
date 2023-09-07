import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { PremiumComponent } from "../../vault/settings/premium.component";
import { PaymentMethodComponent } from "../shared/payment-method.component";
import { UserSubscriptionComponent } from "../shared/user-subscription.component";

import { BillingHistoryViewComponent } from "./billing-history-view.component";
import { SubscriptionComponent } from "./subscription.component";

const routes: Routes = [
  {
    path: "",
    component: SubscriptionComponent,
    data: { titleId: "subscription" },
    children: [
      { path: "", pathMatch: "full", redirectTo: "premium" },
      {
        path: "user-subscription",
        component: UserSubscriptionComponent,
        data: { titleId: "premiumMembership" },
      },
      {
        path: "premium",
        component: PremiumComponent,
        data: { titleId: "goPremium" },
      },
      {
        path: "payment-method",
        component: PaymentMethodComponent,
        data: { titleId: "paymentMethod" },
      },
      {
        path: "billing-history",
        component: BillingHistoryViewComponent,
        data: { titleId: "billingHistory" },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SubscriptionRoutingModule {}

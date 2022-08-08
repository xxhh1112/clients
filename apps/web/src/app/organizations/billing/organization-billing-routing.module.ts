import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { Permissions } from "@bitwarden/common/enums/permissions";

import { PaymentMethodComponent } from "../../settings/payment-method.component";
import { PermissionsGuard } from "../guards/permissions.guard";
import { NavigationPermissionsService } from "../services/navigation-permissions.service";

import { OrgBillingHistoryViewComponent } from "./organization-billing-history-view.component";
import { OrganizationBillingTabComponent } from "./organization-billing-tab.component";
import { OrganizationSubscriptionComponent } from "./organization-subscription.component";

const routes: Routes = [
  {
    path: "",
    component: OrganizationBillingTabComponent,
    canActivate: [PermissionsGuard],
    data: { permissions: NavigationPermissionsService.getPermissions("billing") },
    children: [
      { path: "", pathMatch: "full", redirectTo: "subscription" },
      {
        path: "subscription",
        component: OrganizationSubscriptionComponent,
        data: { titleId: "subscription" },
      },
      {
        path: "payment-method",
        component: PaymentMethodComponent,
        canActivate: [PermissionsGuard],
        data: { titleId: "paymentMethod", permissions: [Permissions.ManageBilling] },
      },
      {
        path: "history",
        component: OrgBillingHistoryViewComponent,
        canActivate: [PermissionsGuard],
        data: { titleId: "billingHistory", permissions: [Permissions.ManageBilling] },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrganizationBillingRoutingModule {}

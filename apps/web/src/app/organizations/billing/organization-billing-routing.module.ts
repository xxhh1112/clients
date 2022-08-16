import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { Organization } from "@bitwarden/common/models/domain/organization";

import { PaymentMethodComponent } from "../../settings/payment-method.component";
import { OrganizationPermissionsGuard } from "../guards/org-permissions.guard";

import { OrgBillingHistoryViewComponent } from "./organization-billing-history-view.component";
import { OrganizationBillingTabComponent } from "./organization-billing-tab.component";
import { OrganizationSubscriptionComponent } from "./organization-subscription.component";

const routes: Routes = [
  {
    path: "",
    component: OrganizationBillingTabComponent,
    canActivate: [OrganizationPermissionsGuard],
    data: { organizationPermissions: (org: Organization) => org.canManageBilling },
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
        canActivate: [OrganizationPermissionsGuard],
        data: {
          titleId: "paymentMethod",
          organizationPermissions: (org: Organization) => org.canManageBilling,
        },
      },
      {
        path: "history",
        component: OrgBillingHistoryViewComponent,
        canActivate: [OrganizationPermissionsGuard],
        data: {
          titleId: "billingHistory",
          organizationPermissions: (org: Organization) => org.canManageBilling,
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrganizationBillingRoutingModule {}

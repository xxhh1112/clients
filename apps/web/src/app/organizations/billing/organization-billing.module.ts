import { NgModule } from "@angular/core";

import { LooseComponentsModule } from "../../shared/loose-components.module";
import { SharedModule } from "../../shared/shared.module";

import { BillingSyncApiKeyComponent } from "./billing-sync-api-key.component";
import { ImageSubscriptionHiddenComponent } from "./image-subscription-hidden.component";
import { OrgBillingHistoryViewComponent } from "./organization-billing-history-view.component";
import { OrganizationBillingRoutingModule } from "./organization-billing-routing.module";
import { OrganizationBillingTabComponent } from "./organization-billing-tab.component";
import { OrganizationSubscriptionComponent } from "./organization-subscription.component";

@NgModule({
  imports: [SharedModule, LooseComponentsModule, OrganizationBillingRoutingModule],
  declarations: [
    BillingSyncApiKeyComponent,
    OrganizationBillingTabComponent,
    ImageSubscriptionHiddenComponent,
    OrganizationSubscriptionComponent,
    OrgBillingHistoryViewComponent,
  ],
})
export class OrganizationBillingModule {}

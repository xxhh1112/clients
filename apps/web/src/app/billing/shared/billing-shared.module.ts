import { NgModule } from "@angular/core";

import { OrganizationCreateModule } from "../../admin-console/organizations/create/organization-create.module";
import { FamiliesForEnterpriseSetupComponent } from "../../admin-console/organizations/sponsorships/families-for-enterprise-setup.component";
import { CreateOrganizationComponent } from "../../admin-console/settings/create-organization.component";
import { UpdateLicenseComponent } from "../../settings/update-license.component";
import { SharedModule } from "../../shared";
import { PremiumComponent } from "../../vault/settings/premium.component";
import { SecretsManagerBillingModule } from "../organizations/secrets-manager/sm-billing.module";

import { AddCreditComponent } from "./add-credit.component";
import { AdjustPaymentComponent } from "./adjust-payment.component";
import { AdjustStorageComponent } from "./adjust-storage.component";
import { BillingHistoryComponent } from "./billing-history.component";
import { OrganizationPlansComponent } from "./organization-plans.component";
import { PaymentMethodComponent } from "./payment-method.component";
import { PaymentComponent } from "./payment.component";
import { TaxInfoComponent } from "./tax-info.component";
import { UserSubscriptionComponent } from "./user-subscription.component";

@NgModule({
  imports: [SharedModule, SecretsManagerBillingModule, OrganizationCreateModule],
  declarations: [
    PaymentComponent,
    TaxInfoComponent,
    OrganizationPlansComponent,
    AdjustStorageComponent,
    UpdateLicenseComponent,
    BillingHistoryComponent,

    AdjustPaymentComponent,
    FamiliesForEnterpriseSetupComponent,
    CreateOrganizationComponent,
    PremiumComponent,
    PaymentMethodComponent,
    AddCreditComponent,
    UserSubscriptionComponent,
  ],
  exports: [
    PaymentComponent,
    TaxInfoComponent,
    OrganizationPlansComponent,
    AdjustStorageComponent,
    UpdateLicenseComponent,
    BillingHistoryComponent,
  ],
})
export class BillingSharedModule {}

import { NgModule } from "@angular/core";

import { OrganizationCreateModule } from "../../admin-console/organizations/create/organization-create.module";
import { SharedModule } from "../../shared";

import { AddCreditComponent } from "./add-credit.component";
import { AdjustPaymentComponent } from "./adjust-payment.component";
import { AdjustStorageComponent } from "./adjust-storage.component";
import { BillingHistoryComponent } from "./billing-history.component";
import { PaymentMethodComponent } from "./payment-method.component";
import { PaymentComponent } from "./payment.component";
import { SecretsManagerSubscribeComponent } from "./sm-subscribe.component";
import { TaxInfoComponent } from "./tax-info.component";
import { UpdateLicenseComponent } from "./update-license.component";

@NgModule({
  imports: [OrganizationCreateModule, SharedModule, PaymentComponent, TaxInfoComponent],
  declarations: [
    AddCreditComponent,
    AdjustPaymentComponent,
    AdjustStorageComponent,
    BillingHistoryComponent,
    PaymentMethodComponent,
    SecretsManagerSubscribeComponent,
    UpdateLicenseComponent,
  ],
  exports: [
    OrganizationCreateModule,
    SharedModule,
    PaymentComponent,
    TaxInfoComponent,

    AdjustStorageComponent,
    BillingHistoryComponent,
    SecretsManagerSubscribeComponent,
    UpdateLicenseComponent,
  ],
})
export class BillingSharedModule {}

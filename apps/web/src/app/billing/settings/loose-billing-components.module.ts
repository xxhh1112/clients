import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared";

import { PaymentComponent } from "./payment.component";
import { TaxInfoComponent } from "./tax-info.component";
import { SecretsManagerBillingModule } from "../organizations/secrets-manager/sm-billing.module";
import { OrganizationPlansComponent } from "./organization-plans.component";
import { OrganizationCreateModule } from "../../admin-console/organizations/create/organization-create.module";

@NgModule({
  imports: [SharedModule, SecretsManagerBillingModule, OrganizationCreateModule],
  declarations: [PaymentComponent, TaxInfoComponent, OrganizationPlansComponent],
  exports: [PaymentComponent, TaxInfoComponent, OrganizationPlansComponent],
})
export class LooseBillingComponentsModule {}

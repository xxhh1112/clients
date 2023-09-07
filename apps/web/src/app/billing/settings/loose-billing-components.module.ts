import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared";

import { PaymentComponent } from "./payment.component";
import { TaxInfoComponent } from "./tax-info.component";

@NgModule({
  imports: [SharedModule],
  declarations: [PaymentComponent, TaxInfoComponent],
  exports: [PaymentComponent, TaxInfoComponent],
})
export class LooseBillingComponentsModule {}

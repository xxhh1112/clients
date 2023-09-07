import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared";

import { PaymentComponent } from "./payment.component";

@NgModule({
  imports: [SharedModule],
  declarations: [PaymentComponent],
  exports: [PaymentComponent],
})
export class LooseBillingComponentsModule {}

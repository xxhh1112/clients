import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { Fido2Component } from "./fido2.component";

@NgModule({
  imports: [CommonModule],
  declarations: [Fido2Component],
  exports: [Fido2Component],
})
export class Fido2Module {}

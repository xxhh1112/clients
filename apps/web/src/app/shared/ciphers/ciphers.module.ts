import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { CiphersComponent } from "./ciphers.component";

@NgModule({
  declarations: [CiphersComponent],
  imports: [CommonModule],
  exports: [CiphersComponent],
})
export class CiphersModule {}

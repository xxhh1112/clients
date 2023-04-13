import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { BitIconProviderComponent } from "./icon-provider.component";
import { BitIconComponent } from "./icon.component";

@NgModule({
  imports: [CommonModule],
  declarations: [BitIconProviderComponent, BitIconComponent],
  exports: [BitIconProviderComponent, BitIconComponent],
})
export class IconModule {}

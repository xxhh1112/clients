import { OverlayModule } from "@angular/cdk/overlay";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { NavigationDirective } from "./navigation.direction";

@NgModule({
  imports: [CommonModule, OverlayModule],
  declarations: [NavigationDirective],
  exports: [NavigationDirective],
})
export class NavigationModule {}

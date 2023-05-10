import { OverlayModule } from "@angular/cdk/overlay";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import { IconModule } from "../icon";
import { IconButtonModule } from "../icon-button/icon-button.module";
import { SharedModule } from "../shared/shared.module";

import { NavDividerComponent } from "./nav-divider.component";
import { NavGroupComponent } from "./nav-group.component";
import { NavItemComponent } from "./nav-item.component";

@NgModule({
  imports: [CommonModule, SharedModule, IconModule, IconButtonModule, OverlayModule, RouterModule],
  declarations: [NavDividerComponent, NavGroupComponent, NavItemComponent],
  exports: [NavDividerComponent, NavGroupComponent, NavItemComponent],
})
export class NavigationModule {}

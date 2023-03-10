import { OverlayModule } from "@angular/cdk/overlay";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import { IconButtonModule } from "../icon-button/icon-button.module";
import { SharedModule } from "../shared/shared.module";

import { NavDividerComponent } from "./nav-divider.component";
import { NavGroupComponent } from "./nav-group.component";
import { NavItemComponent } from "./nav-item.component";
import { SideNavComponent } from "./side-nav.component";
// import { SideNavService } from "./side-nav.service";

@NgModule({
  imports: [CommonModule, SharedModule, IconButtonModule, OverlayModule, RouterModule],
  declarations: [NavDividerComponent, NavGroupComponent, NavItemComponent, SideNavComponent],
  exports: [NavDividerComponent, NavGroupComponent, NavItemComponent, SideNavComponent],
  // providers: [SideNavService]
})
export class NavigationModule {}

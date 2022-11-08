import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SideMenuHeaderComponent } from "./side-menu-header.component";
import { SideMenuItemComponent } from "./side-menu-item.component";
import { SideMenuRecursiveItem } from "./side-menu-recursive-item.component";
import { SideMenuComponent } from "./side-menu.component";

@NgModule({
  imports: [CommonModule],
  declarations: [
    SideMenuComponent,
    SideMenuHeaderComponent,
    SideMenuItemComponent,
    SideMenuRecursiveItem,
  ],
  exports: [SideMenuComponent],
})
export class FiltersModule {}

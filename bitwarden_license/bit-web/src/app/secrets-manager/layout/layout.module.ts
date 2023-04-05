import { NgModule } from "@angular/core";

import { LayoutModule as BitLayoutModule, NavigationModule } from "@bitwarden/components";
import { SharedModule } from "@bitwarden/web-vault/app/shared/shared.module";

import { LayoutComponent } from "./layout.component";
import { NavigationComponent } from "./navigation.component";
import { OrgSwitcherComponent } from "./org-switcher.component";

@NgModule({
  imports: [SharedModule, NavigationModule, BitLayoutModule],
  declarations: [LayoutComponent, NavigationComponent, OrgSwitcherComponent],
})
export class LayoutModule {}

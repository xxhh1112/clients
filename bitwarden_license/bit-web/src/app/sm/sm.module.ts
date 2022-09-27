import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared";

import { LayoutComponent } from "./layout/layout.component";
import { NavigationComponent } from "./layout/navigation.component";
import { SecretsSharedModule } from "./shared/sm-shared.module";
import { SecretsManagerRoutingModule } from "./sm-routing.module";
import { SMGuard } from "./sm.guard";

@NgModule({
  imports: [SharedModule, SecretsManagerRoutingModule, SecretsSharedModule],
  declarations: [LayoutComponent, NavigationComponent],
  providers: [SMGuard],
})
export class SecretsManagerModule {}

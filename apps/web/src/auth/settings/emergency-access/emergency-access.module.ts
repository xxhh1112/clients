import { NgModule } from "@angular/core";

import { I18nPipe } from "@bitwarden/angular/pipes/i18n.pipe";

import { LooseComponentsModule, SharedModule } from "../../../app/shared";

import { EmergencyAccessRoutingModule } from "./emergency-access-routing.module";
import { EmergencyAccessViewComponent } from "./emergency-access-view.component";
import { EmergencyAccessComponent } from "./emergency-access.component";
import { StatusBadgeComponent } from "./status-badges.component";

@NgModule({
  imports: [SharedModule, LooseComponentsModule, EmergencyAccessRoutingModule],
  exports: [EmergencyAccessComponent, EmergencyAccessViewComponent],
  declarations: [EmergencyAccessComponent, EmergencyAccessViewComponent, StatusBadgeComponent],
  providers: [I18nPipe],
})
export class EmergencyAccessModule {}

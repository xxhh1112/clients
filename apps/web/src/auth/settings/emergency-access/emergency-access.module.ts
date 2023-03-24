import { NgModule } from "@angular/core";

import { LooseComponentsModule, SharedModule } from "../../../app/shared";

import { EmergencyAccessDialogComponent } from "./dialogs/emergency-access-dialog.component";
import { EmergencyAccessRoutingModule } from "./emergency-access-routing.module";
import { EmergencyAccessViewComponent } from "./emergency-access-view.component";
import { EmergencyAccessComponent } from "./emergency-access.component";
import { EmergencyAccessService } from "./emergency-access.service";
import { StatusBadgeComponent } from "./status-badges.component";

@NgModule({
  imports: [SharedModule, LooseComponentsModule, EmergencyAccessRoutingModule],
  exports: [EmergencyAccessComponent, EmergencyAccessViewComponent],
  declarations: [
    EmergencyAccessComponent,
    EmergencyAccessDialogComponent,
    EmergencyAccessViewComponent,
    StatusBadgeComponent,
  ],
  providers: [EmergencyAccessService],
})
export class EmergencyAccessModule {}

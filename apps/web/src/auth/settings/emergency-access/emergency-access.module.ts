import { NgModule } from "@angular/core";

import { LooseComponentsModule, SharedModule } from "../../../app/shared";

import { AccessTypePipe } from "./access-type.pipe";
import { ConfirmDialogComponent } from "./dialogs/confirm-dialog.component";
import { EmergencyAccessDialogComponent } from "./dialogs/emergency-access-dialog.component";
import { TakeoverDialogComponent } from "./dialogs/takeover-dialog.component";
import { EmergencyAccessRoutingModule } from "./emergency-access-routing.module";
import { EmergencyAccessViewComponent } from "./emergency-access-view.component";
import { EmergencyAccessComponent } from "./emergency-access.component";
import { EmergencyAccessService } from "./emergency-access.service";
import { StatusBadgeComponent } from "./status-badges.component";

@NgModule({
  imports: [SharedModule, LooseComponentsModule, EmergencyAccessRoutingModule],
  exports: [EmergencyAccessComponent, EmergencyAccessViewComponent],
  declarations: [
    AccessTypePipe,
    ConfirmDialogComponent,
    EmergencyAccessComponent,
    EmergencyAccessDialogComponent,
    EmergencyAccessViewComponent,
    StatusBadgeComponent,
    TakeoverDialogComponent,
  ],
  providers: [EmergencyAccessService],
})
export class EmergencyAccessModule {}

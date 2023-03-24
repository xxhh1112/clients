import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { EmergencyAccessViewComponent } from "./emergency-access-view.component";
import { EmergencyAccessComponent } from "./emergency-access.component";

const routes: Routes = [
  {
    path: "",
    component: EmergencyAccessComponent,
    data: { titleId: "emergencyAccess" },
  },
  {
    path: ":id",
    component: EmergencyAccessViewComponent,
    data: { titleId: "emergencyAccess" },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmergencyAccessRoutingModule {}

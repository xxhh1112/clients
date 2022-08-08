import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { Permissions } from "@bitwarden/common/enums/permissions";

import { PermissionsGuard } from "../guards/permissions.guard";
import { EventsComponent } from "../manage/events.component";
import { NavigationPermissionsService } from "../services/navigation-permissions.service";
import { ExposedPasswordsReportComponent } from "../tools/exposed-passwords-report.component";
import { InactiveTwoFactorReportComponent } from "../tools/inactive-two-factor-report.component";
import { ReusedPasswordsReportComponent } from "../tools/reused-passwords-report.component";
import { UnsecuredWebsitesReportComponent } from "../tools/unsecured-websites-report.component";
import { WeakPasswordsReportComponent } from "../tools/weak-passwords-report.component";

import { ReportingComponent } from "./reporting.component";
import { ReportsHomeComponent } from "./reports-home.component";

const routes: Routes = [
  {
    path: "",
    component: ReportingComponent,
    canActivate: [PermissionsGuard],
    data: { permissions: NavigationPermissionsService.getPermissions("reporting") },
    children: [
      { path: "", pathMatch: "full", redirectTo: "reports" },
      {
        path: "reports",
        component: ReportsHomeComponent,
        canActivate: [PermissionsGuard],
        data: {
          titleId: "reports",
          permissions: [Permissions.AccessReports],
        },
        children: [
          {
            path: "exposed-passwords-report",
            component: ExposedPasswordsReportComponent,
            canActivate: [PermissionsGuard],
            data: {
              titleId: "exposedPasswordsReport",
              permissions: [Permissions.AccessReports],
            },
          },
          {
            path: "inactive-two-factor-report",
            component: InactiveTwoFactorReportComponent,
            canActivate: [PermissionsGuard],
            data: {
              titleId: "inactive2faReport",
              permissions: [Permissions.AccessReports],
            },
          },
          {
            path: "reused-passwords-report",
            component: ReusedPasswordsReportComponent,
            canActivate: [PermissionsGuard],
            data: {
              titleId: "reusedPasswordsReport",
              permissions: [Permissions.AccessReports],
            },
          },
          {
            path: "unsecured-websites-report",
            component: UnsecuredWebsitesReportComponent,
            canActivate: [PermissionsGuard],
            data: {
              titleId: "unsecuredWebsitesReport",
              permissions: [Permissions.AccessReports],
            },
          },
          {
            path: "weak-passwords-report",
            component: WeakPasswordsReportComponent,
            canActivate: [PermissionsGuard],
            data: {
              titleId: "weakPasswordsReport",
              permissions: [Permissions.AccessReports],
            },
          },
        ],
      },
      {
        path: "events",
        component: EventsComponent,
        canActivate: [PermissionsGuard],
        data: {
          titleId: "eventLogs",
          permissions: [Permissions.AccessEventLogs],
        },
      },
    ],
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrganizationReportingRoutingModule {}

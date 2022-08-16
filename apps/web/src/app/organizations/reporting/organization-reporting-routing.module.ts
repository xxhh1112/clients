import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { Organization } from "@bitwarden/common/models/domain/organization";

import { OrganizationPermissionsGuard } from "../guards/org-permissions.guard";
import { EventsComponent } from "../manage/events.component";
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
    canActivate: [OrganizationPermissionsGuard],
    data: { organizationPermissions: (org: Organization) => org.canAccessReports },
    children: [
      { path: "", pathMatch: "full", redirectTo: "reports" },
      {
        path: "reports",
        component: ReportsHomeComponent,
        canActivate: [OrganizationPermissionsGuard],
        data: {
          titleId: "reports",
          organizationPermissions: (org: Organization) => org.canAccessReports,
        },
        children: [
          {
            path: "exposed-passwords-report",
            component: ExposedPasswordsReportComponent,
            canActivate: [OrganizationPermissionsGuard],
            data: {
              titleId: "exposedPasswordsReport",
              organizationPermissions: (org: Organization) => org.canAccessReports,
            },
          },
          {
            path: "inactive-two-factor-report",
            component: InactiveTwoFactorReportComponent,
            canActivate: [OrganizationPermissionsGuard],
            data: {
              titleId: "inactive2faReport",
              organizationPermissions: (org: Organization) => org.canAccessReports,
            },
          },
          {
            path: "reused-passwords-report",
            component: ReusedPasswordsReportComponent,
            canActivate: [OrganizationPermissionsGuard],
            data: {
              titleId: "reusedPasswordsReport",
              organizationPermissions: (org: Organization) => org.canAccessReports,
            },
          },
          {
            path: "unsecured-websites-report",
            component: UnsecuredWebsitesReportComponent,
            canActivate: [OrganizationPermissionsGuard],
            data: {
              titleId: "unsecuredWebsitesReport",
              organizationPermissions: (org: Organization) => org.canAccessReports,
            },
          },
          {
            path: "weak-passwords-report",
            component: WeakPasswordsReportComponent,
            canActivate: [OrganizationPermissionsGuard],
            data: {
              titleId: "weakPasswordsReport",
              organizationPermissions: (org: Organization) => org.canAccessReports,
            },
          },
        ],
      },
      {
        path: "events",
        component: EventsComponent,
        canActivate: [OrganizationPermissionsGuard],
        data: {
          titleId: "eventLogs",
          organizationPermissions: (org: Organization) => org.canAccessEventLogs,
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

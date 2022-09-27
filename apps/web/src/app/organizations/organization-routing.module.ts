import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { AuthGuard } from "@bitwarden/angular/guards/auth.guard";

import { OrganizationPermissionsGuard } from "./guards/org-permissions.guard";
import { OrganizationLayoutComponent } from "./layouts/organization-layout.component";
import { GroupsComponent } from "./manage/groups.component";
import { PeopleComponent } from "./manage/people.component";
import {
  canAccessGroupsTab,
  canAccessMembersTab,
  canAccessOrgAdmin,
} from "./navigation-permissions";
import { VaultModule } from "./vault/vault.module";

const routes: Routes = [
  {
    path: ":organizationId",
    component: OrganizationLayoutComponent,
    canActivate: [AuthGuard, OrganizationPermissionsGuard],
    data: {
      organizationPermissions: canAccessOrgAdmin,
    },
    children: [
      { path: "", pathMatch: "full", redirectTo: "vault" },
      {
        path: "vault",
        loadChildren: () => VaultModule,
      },
      {
        path: "settings",
        loadChildren: () => import("./settings").then((m) => m.OrganizationSettingsModule),
      },
      {
        path: "members",
        component: PeopleComponent,
        canActivate: [OrganizationPermissionsGuard],
        data: {
          titleId: "members",
          organizationPermissions: canAccessMembersTab,
        },
      },
      {
        path: "groups",
        component: GroupsComponent,
        canActivate: [OrganizationPermissionsGuard],
        data: {
          titleId: "groups",
          organizationPermissions: canAccessGroupsTab,
        },
      },
      {
        path: "reporting",
        loadChildren: () =>
          import("./reporting/organization-reporting.module").then(
            (m) => m.OrganizationReportingModule
          ),
      },
      {
        path: "billing",
        loadChildren: () =>
          import("./billing/organization-billing.module").then((m) => m.OrganizationBillingModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrganizationsRoutingModule {}

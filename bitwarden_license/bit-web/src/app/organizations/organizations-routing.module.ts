import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { AuthGuard } from "jslib-angular/guards/auth.guard";
import { Permissions } from "jslib-common/enums/permissions";

import { PermissionsGuard } from "src/app/components/organizations/guards/permissions.guard";
import { OrganizationLayoutComponent } from "src/app/components/organizations/layouts/organization-layout.component";
import { ManageComponent } from "src/app/components/organizations/manage/manage.component";
import { NavigationPermissionsService } from "src/app/components/organizations/services/navigation-permissions.service";

import { SsoComponent } from "./manage/sso.component";

const routes: Routes = [
  {
    path: "organizations/:organizationId",
    component: OrganizationLayoutComponent,
    canActivate: [AuthGuard, PermissionsGuard],
    children: [
      {
        path: "manage",
        component: ManageComponent,
        canActivate: [PermissionsGuard],
        data: {
          permissions: NavigationPermissionsService.getPermissions("manage"),
        },
        children: [
          {
            path: "sso",
            component: SsoComponent,
            canActivate: [PermissionsGuard],
            data: {
              permissions: [Permissions.ManageSso],
            },
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrganizationsRoutingModule {}

import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { OrganizationPermissionsGuard } from "src/app/organizations/guards/org-permissions.guard";
import { buildFlaggedRoute } from "src/app/oss-routing.module";

import { LayoutComponent } from "./layout/layout.component";
import { NavigationComponent } from "./layout/navigation.component";
import { SecretsModule } from "./secrets/secrets.module";
import { SMGuard } from "./sm.guard";

const routes: Routes = [
  buildFlaggedRoute("secretsManager", {
    path: ":organizationId",
    component: LayoutComponent,
    canActivate: [OrganizationPermissionsGuard, SMGuard],
    children: [
      {
        path: "",
        component: NavigationComponent,
        outlet: "sidebar",
      },
      {
        path: "secrets",
        loadChildren: () => SecretsModule,
      },
      {
        path: "",
        redirectTo: "secrets",
        pathMatch: "full",
      },
    ],
  }),
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SecretsManagerRoutingModule {}

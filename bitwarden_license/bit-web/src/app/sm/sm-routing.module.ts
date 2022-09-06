import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { LayoutComponent } from "./layout/layout.component";
import { NavigationComponent } from "./layout/navigation.component";
import { ProjectsModule } from "./projects/projects.module";
import { SecretsModule } from "./secrets/secrets.module";
import { SMGuard } from "./sm.guard";

const routes: Routes = [
  {
    path: ":organizationId",
    component: LayoutComponent,
    canActivate: [SMGuard],
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
        path: "projects",
        loadChildren: () => ProjectsModule,
      },
      {
        path: "",
        redirectTo: "secrets",
        pathMatch: "full",
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SecretsManagerRoutingModule {}

import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared";

import { SecretsSharedModule } from "../shared/sm-shared.module";

import { ProjectsListComponent } from "./projects-list.component";
import { ProjectsRoutingModule } from "./projects-routing.module";
import { ProjectsComponent } from "./projects.component";

@NgModule({
  imports: [SharedModule, ProjectsRoutingModule, SecretsSharedModule],
  declarations: [ProjectsComponent, ProjectsListComponent],
  providers: [],
})
export class ProjectsModule {}

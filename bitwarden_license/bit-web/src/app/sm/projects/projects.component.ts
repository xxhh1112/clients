import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { ProjectApiService } from "./project-api.service";
import { ProjectResponse } from "./responses/project.response";

@Component({
  selector: "sm-projects",
  templateUrl: "./projects.component.html",
})
export class ProjectsComponent implements OnInit {
  private organizationId: string;

  projects: ProjectResponse[];

  constructor(private route: ActivatedRoute, private projectsApiService: ProjectApiService) {}

  ngOnInit() {
    this.route.params.subscribe(async (params: any) => {
      this.organizationId = params.organizationId;
      await this.getProjects();
    });
  }

  private async getProjects() {
    this.projects = (
      await this.projectsApiService.getProjectsByOrganizationId(this.organizationId)
    ).data;
  }
}

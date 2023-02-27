import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { ListResponse } from "@bitwarden/common/models/response/list.response";

import { ProjectView } from "../models/view/project.view";
import { BulkOperationStatus } from "../shared/dialogs/bulk-status-dialog.component";

import { ProjectRequest } from "./models/requests/project.request";
import { ProjectResponse } from "./models/responses/project.response";

@Injectable({
  providedIn: "root",
})
export class ProjectService {
  protected _project = new Subject<ProjectView>();
  project$ = this._project.asObservable();

  constructor(private cryptoService: CryptoService, private apiService: ApiService) {}

  async getByProjectId(projectId: string): Promise<ProjectView> {
    const r = await this.apiService.send("GET", "/projects/" + projectId, null, true, true);
    const projectResponse = new ProjectResponse(r);
    return await this.decryptProject(projectResponse);
  }

  async getProjects(organizationId: string): Promise<ProjectView[]> {
    const r = await this.apiService.send(
      "GET",
      "/organizations/" + organizationId + "/projects",
      null,
      true,
      true
    );
    const results = new ListResponse(r, ProjectResponse);

    return await this.decryptProjects(results.data);
  }

  async create(projectView: ProjectView): Promise<ProjectView> {
    const request = await this.makeProjectRequest(projectView);
    const r = await this.apiService.send(
      "POST",
      "/organizations/" + projectView.organizationId + "/projects",
      request,
      true,
      true
    );

    const project = await this.decryptProject(new ProjectResponse(r));
    this._project.next(project);
    return project;
  }

  async update(projectView: ProjectView) {
    const request = await this.makeProjectRequest(projectView);
    const r = await this.apiService.send("PUT", "/projects/" + projectView.id, request, true, true);
    this._project.next(await this.decryptProject(new ProjectResponse(r)));
  }

  async delete(projects: ProjectView[]): Promise<BulkOperationStatus[]> {
    const projectIds = projects.map((project) => project.id);
    const r = await this.apiService.send("POST", "/projects/delete", projectIds, true, true);
    this._project.next(null);

    return r.data.map((element: { id: string; error: string }) => {
      const bulkOperationStatus = new BulkOperationStatus();
      bulkOperationStatus.id = element.id;
      bulkOperationStatus.name = projects.find((project) => project.id == element.id).name;
      bulkOperationStatus.errorMessage = element.error;
      return bulkOperationStatus;
    });
  }

  private async makeProjectRequest(projectView: ProjectView): Promise<ProjectRequest> {
    const project = await this.cryptoService.encryptView(projectView);

    const request = new ProjectRequest();
    request.name = project.name;
    return request;
  }

  private async decryptProject(response: ProjectResponse): Promise<ProjectView> {
    return await this.cryptoService.decryptDomain(ProjectView, response.toProject());
  }

  private async decryptProjects(projects: ProjectResponse[]): Promise<ProjectView[]> {
    return await Promise.all(
      projects.map(async (p) => this.cryptoService.decryptDomain(ProjectView, p.toProject()))
    );
  }
}

import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

import { AbstractEncryptService } from "@bitwarden/common/abstractions/abstractEncrypt.service";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { EncString } from "@bitwarden/common/models/domain/enc-string";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetric-crypto-key";
import { ListResponse } from "@bitwarden/common/models/response/list.response";
import { ProjectListView } from "@bitwarden/common/models/view/project-list.view";
import { ProjectView } from "@bitwarden/common/models/view/project.view";

import { ProjectRequest } from "./requests/project.request";
import { ProjectListItemResponse } from "./responses/project-list-item.response";
import { ProjectResponse } from "./responses/project.response";

@Injectable({
  providedIn: "root",
})
export class ProjectService {
  protected _project = new Subject<ProjectView>();
  project$ = this._project.asObservable();

  constructor(
    private cryptoService: CryptoService,
    private apiService: ApiService,
    private encryptService: AbstractEncryptService
  ) {}

  async getByProjectId(projectId: string): Promise<ProjectView> {
    const r = await this.apiService.send("GET", "/projects/" + projectId, null, true, true);
    const projectResponse = new ProjectResponse(r);
    return await this.createProjectView(projectResponse);
  }

  async getProjects(organizationId: string): Promise<ProjectListView[]> {
    const r = await this.apiService.send(
      "GET",
      "/organizations/" + organizationId + "/projects",
      null,
      true,
      true
    );
    const results = new ListResponse(r, ProjectListItemResponse);
    return await this.createProjectsListView(organizationId, results.data);
  }

  async create(organizationId: string, projectView: ProjectView) {
    const request = await this.getProjectRequest(organizationId, projectView);
    const r = await this.apiService.send(
      "POST",
      "/organizations/" + organizationId + "/projects",
      request,
      true,
      true
    );
    this._project.next(await this.createProjectView(new ProjectResponse(r)));
  }

  async update(organizationId: string, projectView: ProjectView) {
    const request = await this.getProjectRequest(organizationId, projectView);
    const r = await this.apiService.send("PUT", "/projects/" + projectView.id, request, true, true);
    this._project.next(await this.createProjectView(new ProjectResponse(r)));
  }

  private async getOrganizationKey(organizationId: string): Promise<SymmetricCryptoKey> {
    return await this.cryptoService.getOrgKey(organizationId);
  }

  private async getProjectRequest(
    organizationId: string,
    projectView: ProjectView
  ): Promise<ProjectRequest> {
    const orgKey = await this.getOrganizationKey(organizationId);
    const request = new ProjectRequest();
    request.name = await this.encryptService.encrypt(projectView.name, orgKey);

    return request;
  }

  private async createProjectView(projectResponse: ProjectResponse): Promise<ProjectView> {
    const orgKey = await this.getOrganizationKey(projectResponse.organizationId);

    const projectView = new ProjectView();
    projectView.id = projectResponse.id;
    projectView.organizationId = projectResponse.organizationId;
    projectView.creationDate = projectResponse.creationDate;
    projectView.revisionDate = projectResponse.revisionDate;
    projectView.name = await this.encryptService.decryptToUtf8(
      new EncString(projectResponse.name),
      orgKey
    );

    return projectView;
  }

  private async createProjectsListView(
    organizationId: string,
    projects: ProjectListItemResponse[]
  ): Promise<ProjectListView[]> {
    const orgKey = await this.getOrganizationKey(organizationId);
    return await Promise.all(
      projects.map(async (s: ProjectListItemResponse) => {
        const projectListView = new ProjectListView();
        projectListView.id = s.id;
        projectListView.organizationId = s.organizationId;
        projectListView.name = await this.encryptService.decryptToUtf8(
          new EncString(s.name),
          orgKey
        );
        projectListView.creationDate = s.creationDate;
        projectListView.revisionDate = s.revisionDate;
        return projectListView;
      })
    );
  }
}

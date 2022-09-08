import { Injectable } from "@angular/core";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { ListResponse } from "@bitwarden/common/models/response/listResponse";

import { ProjectResponse } from "./responses/project.response";

@Injectable({
  providedIn: "any",
})
export class ProjectApiService {
  constructor(private apiService: ApiService) {}

  async getProjectsByOrganizationId(
    organizationId: string
  ): Promise<ListResponse<ProjectResponse>> {
    const r = await this.apiService.send(
      "GET",
      "/organizations/" + organizationId + "/projects",
      null,
      true,
      true
    );
    return new ListResponse(r, ProjectResponse);
  }
}

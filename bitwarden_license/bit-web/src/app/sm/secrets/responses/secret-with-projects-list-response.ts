import { BaseResponse } from "../../../../../../../libs/common/src/models/response/baseResponse";

import { ProjectsMappedToSecretResponse } from "./projects-mapped-to-secret-response";
import { SecretListItemResponse } from "./secret-list-item.response";

export class SecretWithProjectsListResponse extends BaseResponse {
  secrets: SecretListItemResponse[];
  projects: ProjectsMappedToSecretResponse[];

  constructor(response: any) {
    super(response);
    const secrets = this.getResponseProperty("secrets");
    const projects = this.getResponseProperty("projects");
    this.projects =
      projects == null ? null : projects.map((k: any) => new ProjectsMappedToSecretResponse(k));
    this.secrets = secrets == null ? [] : secrets.map((dr: any) => new SecretListItemResponse(dr));
  }
}

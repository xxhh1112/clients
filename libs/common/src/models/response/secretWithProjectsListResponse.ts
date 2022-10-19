import { ProjectsMappedToSecret } from "../view/projectsMappedToSecret";

import { BaseResponse } from "./baseResponse";

export class SecretWithProjectsListResponse<T> extends BaseResponse {
  secrets: T[];
  projects: ProjectsMappedToSecret[];

  constructor(response: any, t: new (dataResponse: any) => T) {
    super(response);
    const secrets = this.getResponseProperty("secrets");
    const projects = this.getResponseProperty("projects");

    this.projects =
      projects == null ? null : projects.map((k: any) => new ProjectsMappedToSecret(k));

    //Set the projects on the secrets
    secrets.forEach((element: any) => {
      element.projects = this.projects.find((item) => item.id.match(element.projects));
    });

    this.secrets = secrets == null ? [] : secrets.map((dr: any) => new t(dr));
  }
}

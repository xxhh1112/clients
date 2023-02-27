import { EncString } from "@bitwarden/common/models/domain/enc-string";
import { BaseResponse } from "@bitwarden/common/models/response/base.response";

import { Secret } from "../../models/secret";

import { SecretProjectResponse } from "./secret-project.response";

export class SecretListItemResponse extends BaseResponse {
  id: string;
  organizationId: string;
  name: string;
  creationDate: string;
  revisionDate: string;
  projects: SecretProjectResponse[];

  constructor(response: any) {
    super(response);
    this.id = this.getResponseProperty("Id");
    this.organizationId = this.getResponseProperty("OrganizationId");
    this.name = this.getResponseProperty("Key");
    this.creationDate = this.getResponseProperty("CreationDate");
    this.revisionDate = this.getResponseProperty("RevisionDate");

    const project = this.getResponseProperty("projects");
    this.projects = project == null ? null : project.map((k: any) => new SecretProjectResponse(k));
  }

  toSecret() {
    const domain = new Secret();
    domain.id = this.id;
    domain.organizationId = this.organizationId;
    domain.name = new EncString(this.name);
    domain.creationDate = new Date(this.creationDate);
    domain.revisionDate = new Date(this.revisionDate);

    return domain;
  }
}

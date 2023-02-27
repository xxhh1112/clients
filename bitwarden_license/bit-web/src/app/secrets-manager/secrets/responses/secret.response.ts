import { EncString } from "@bitwarden/common/models/domain/enc-string";
import { BaseResponse } from "@bitwarden/common/models/response/base.response";

import { Secret } from "../../models/secret";

import { SecretProjectResponse } from "./secret-project.response";

export class SecretResponse extends BaseResponse {
  id: string;
  organizationId: string;
  name: string;
  value: string;
  note: string;
  creationDate: string;
  revisionDate: string;
  projects: SecretProjectResponse[];

  constructor(response: any) {
    super(response);
    this.id = this.getResponseProperty("Id");
    this.organizationId = this.getResponseProperty("OrganizationId");
    this.name = this.getResponseProperty("Key");
    this.value = this.getResponseProperty("Value");
    this.note = this.getResponseProperty("Note");
    this.creationDate = this.getResponseProperty("CreationDate");
    this.revisionDate = this.getResponseProperty("RevisionDate");

    const projects = this.getResponseProperty("Projects");
    this.projects =
      projects == null ? null : projects.map((k: any) => new SecretProjectResponse(k));
  }

  toSecret() {
    const secret = new Secret();
    secret.id = this.id;
    secret.organizationId = this.organizationId;
    secret.name = new EncString(this.name);
    secret.value = new EncString(this.value);
    secret.note = new EncString(this.note);
    secret.creationDate = new Date(this.creationDate);
    secret.revisionDate = new Date(this.revisionDate);

    return secret;
  }
}

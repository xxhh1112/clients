import { EncString } from "@bitwarden/common/models/domain/enc-string";
import { BaseResponse } from "@bitwarden/common/models/response/base.response";

import { ServiceAccount } from "../../../models/service-account";

export class ServiceAccountResponse extends BaseResponse {
  id: string;
  organizationId: string;
  name: string;
  creationDate: string;
  revisionDate: string;

  constructor(response: any) {
    super(response);
    this.id = this.getResponseProperty("Id");
    this.organizationId = this.getResponseProperty("OrganizationId");
    this.name = this.getResponseProperty("Name");
    this.creationDate = this.getResponseProperty("CreationDate");
    this.revisionDate = this.getResponseProperty("RevisionDate");
  }

  toServiceAccount(): ServiceAccount {
    const domain = new ServiceAccount();
    domain.id = this.id;
    domain.organizationId = this.organizationId;
    domain.name = new EncString(this.name);
    domain.creationDate = new Date(this.creationDate);
    domain.revisionDate = new Date(this.revisionDate);
    return domain;
  }
}

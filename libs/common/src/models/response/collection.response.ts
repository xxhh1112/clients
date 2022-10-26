import { BaseResponse } from "./base.response";
import { SelectionReadOnlyResponse } from "./selection-read-only.response";

export class CollectionResponse extends BaseResponse {
  id: string;
  organizationId: string;
  name: string;
  externalId: string;

  constructor(response: any) {
    super(response);
    this.id = this.getResponseProperty("Id");
    this.organizationId = this.getResponseProperty("OrganizationId");
    this.name = this.getResponseProperty("Name");
    this.externalId = this.getResponseProperty("ExternalId");
  }
}

export class CollectionDetailsResponse extends CollectionResponse {
  readOnly: boolean;

  constructor(response: any) {
    super(response);
    this.readOnly = this.getResponseProperty("ReadOnly") || false;
  }
}

export class CollectionAccessDetailsResponse extends CollectionResponse {
  groups: SelectionReadOnlyResponse[] = [];
  users: SelectionReadOnlyResponse[] = [];

  constructor(response: any) {
    super(response);
    const groups = this.getResponseProperty("Groups");
    if (groups != null) {
      this.groups = groups.map((g: any) => new SelectionReadOnlyResponse(g));
    }

    const users = this.getResponseProperty("Users");
    if (users != null) {
      this.users = users.map((g: any) => new SelectionReadOnlyResponse(g));
    }
  }
}

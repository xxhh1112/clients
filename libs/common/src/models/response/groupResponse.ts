import { BaseResponse } from "./baseResponse";
import { SelectionReadOnlyResponse } from "./selectionReadOnlyResponse";

export interface IGroupResponse {
  id: string;
  organizationId: string;
  name: string;
  accessAll: boolean;
  externalId: string;
}

export class GroupResponse extends BaseResponse implements IGroupResponse {
  id: string;
  organizationId: string;
  name: string;
  accessAll: boolean;
  externalId: string;

  constructor(response: any) {
    super(response);
    this.id = this.getResponseProperty("Id");
    this.organizationId = this.getResponseProperty("OrganizationId");
    this.name = this.getResponseProperty("Name");
    this.accessAll = this.getResponseProperty("AccessAll");
    this.externalId = this.getResponseProperty("ExternalId");
  }
}

export interface IGroupDetailsResponse extends IGroupResponse {
  collections: SelectionReadOnlyResponse[];
}

export class GroupDetailsResponse extends GroupResponse implements IGroupDetailsResponse {
  collections: SelectionReadOnlyResponse[] = [];

  constructor(response: any) {
    super(response);
    const collections = this.getResponseProperty("Collections");
    if (collections != null) {
      this.collections = collections.map((c: any) => new SelectionReadOnlyResponse(c));
    }
  }
}

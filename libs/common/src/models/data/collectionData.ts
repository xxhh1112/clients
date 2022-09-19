import {
  CollectionDetailsResponse,
  CollectionGroupDetailsResponse,
} from "../response/collectionResponse";
import { SelectionReadOnlyResponse } from "../response/selectionReadOnlyResponse";

export class CollectionData {
  id: string;
  organizationId: string;
  name: string;
  externalId: string;
  readOnly: boolean;

  constructor(response: CollectionDetailsResponse | CollectionGroupDetailsResponse) {
    this.id = response.id;
    this.organizationId = response.organizationId;
    this.name = response.name;
    this.externalId = response.externalId;

    if (response instanceof CollectionDetailsResponse) {
      this.readOnly = response.readOnly;
    }
  }
}

export class CollectionGroupDetailsData extends CollectionData {
  groups: SelectionReadOnlyResponse[] = [];

  constructor(response: CollectionGroupDetailsResponse) {
    super(response);
    this.groups = response.groups;
  }
}

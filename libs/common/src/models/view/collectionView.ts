import { Collection } from "../domain/collection";
import { ITreeNodeObject } from "../domain/treeNode";
import { SelectionReadOnlyRequest } from "../request/selectionReadOnlyRequest";
import { CollectionGroupDetailsResponse } from "../response/collectionResponse";

import { View } from "./view";

export class CollectionView implements View, ITreeNodeObject {
  id: string = null;
  organizationId: string = null;
  name: string = null;
  externalId: string = null;
  readOnly: boolean = null;
  hidePasswords: boolean = null;

  constructor(c?: Collection | Partial<CollectionView>) {
    if (!c) {
      return;
    }
    if (c instanceof Collection) {
      this.id = c.id;
      this.organizationId = c.organizationId;
      this.externalId = c.externalId;
      this.readOnly = c.readOnly;
      this.hidePasswords = c.hidePasswords;
    }
    Object.assign(this, c);
  }
}

export class CollectionGroupDetailsView extends CollectionView {
  groups: SelectionReadOnlyRequest[] = [];

  constructor(
    c?: Collection | CollectionGroupDetailsResponse | Partial<CollectionGroupDetailsView>
  ) {
    super(c);
    if (!c) {
      return;
    }
    if (c instanceof CollectionGroupDetailsResponse) {
      this.groups = c.groups;
    }
  }
}

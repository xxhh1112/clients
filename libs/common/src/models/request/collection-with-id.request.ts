import { Collection } from "../domain/collection";

import { SelectionReadOnlyRequest } from "./selection-read-only.request";

export class CollectionWithIdRequest {
  name: string;
  externalId: string;
  groups: SelectionReadOnlyRequest[] = [];
  users: SelectionReadOnlyRequest[] = [];
  id: string;

  constructor(collection?: Collection) {
    if (collection == null) {
      return;
    }
    this.id = collection.id;
    this.name = collection.name ? collection.name.encryptedString : null;
    this.externalId = collection.externalId;
  }
}

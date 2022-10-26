import { CollectionAccessDetailsResponse } from "../response/collection.response";

import { CollectionAccessSelectionView } from "./collection-access-selection-view";
import { CollectionView } from "./collection.view";

export class CollectionAdminView extends CollectionView {
  groups: CollectionAccessSelectionView[] = [];
  users: CollectionAccessSelectionView[] = [];

  constructor(response?: CollectionAccessDetailsResponse) {
    super(response);

    if (!response) {
      return;
    }

    this.groups = response.groups
      ? response.groups.map((g) => new CollectionAccessSelectionView(g))
      : [];

    this.users = response.users
      ? response.users.map((g) => new CollectionAccessSelectionView(g))
      : [];
  }
}

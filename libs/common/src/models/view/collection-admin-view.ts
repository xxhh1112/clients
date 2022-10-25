import { CollectionGroupDetailsResponse } from "../response/collection.response";

import { CollectionAccessSelectionView } from "./collection-access-selection-view";
import { CollectionView } from "./collection.view";

export class CollectionAdminView extends CollectionView {
  groups: CollectionAccessSelectionView[] = [];

  constructor(response?: CollectionGroupDetailsResponse) {
    super(response);

    if (!response) {
      return;
    }

    this.groups = response.groups
      ? response.groups.map((g) => new CollectionAccessSelectionView(g))
      : [];
  }
}

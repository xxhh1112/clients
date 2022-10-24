import { CollectionGroupDetailsResponse } from "../response/collection.response";

import { CollectionGroupSelectionView } from "./collection-group-selection-view";
import { CollectionView } from "./collection.view";

export class CollectionAdminView extends CollectionView {
  groups: CollectionGroupSelectionView[] = [];

  constructor(response?: CollectionGroupDetailsResponse) {
    super(response);

    if (!response) {
      return;
    }

    this.groups = response.groups
      ? response.groups.map((g) => new CollectionGroupSelectionView(g))
      : [];
  }
}

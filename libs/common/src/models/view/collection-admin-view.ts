import { CollectionGroupDetailsResponse } from "../response/collectionResponse";

import { CollectionGroupSelectionView } from "./collection-group-selection-view";
import { CollectionView } from "./collectionView";

export class CollectionAdminView extends CollectionView {
  readonly groups: CollectionGroupSelectionView[] = [];

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

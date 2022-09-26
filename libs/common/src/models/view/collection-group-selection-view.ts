import { SelectionReadOnlyResponse } from "../response/selectionReadOnlyResponse";

import { View } from "./view";

export class CollectionGroupSelectionView extends View {
  readonly id: string;
  readonly readOnly: boolean;
  readonly hidePasswords: boolean;

  constructor(response?: SelectionReadOnlyResponse) {
    super();

    if (!response) {
      return;
    }

    this.id = response.id;
    this.readOnly = response.readOnly;
    this.hidePasswords = response.hidePasswords;
  }
}

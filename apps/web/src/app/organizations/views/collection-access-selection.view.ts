import { View } from "@bitwarden/common/models/view/view";

interface SelectionResponseLike {
  id: string;
  readOnly: boolean;
  hidePasswords: boolean;
}

export class CollectionAccessSelectionView extends View {
  id: string;
  readOnly: boolean;
  hidePasswords: boolean;

  constructor(source?: SelectionResponseLike) {
    super();

    if (source == undefined) {
      return;
    }
    this.id = source.id;
    this.readOnly = source.readOnly;
    this.hidePasswords = source.hidePasswords;
  }
}

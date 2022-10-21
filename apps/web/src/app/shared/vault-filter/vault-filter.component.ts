import { Component, Input } from "@angular/core";

import { CollectionView } from "@bitwarden/common/models/view/collection.view";

@Component({
  selector: "app-new-vault-filter",
  templateUrl: "./vault-filter.component.html",
})
export class VaultFilterComponent {
  @Input()
  collections: CollectionView[] = [];
}

import { Component, Input } from "@angular/core";

import { BadgeTypes } from "./badge.directive";

@Component({
  selector: "bit-badge-list",
  templateUrl: "badge-list.component.html",
})
export class BadgeListComponent {
  private _maxItems: number | null = null;
  private _items: string[] = [];

  protected filteredItems: string[] = [];

  @Input() badgeType: BadgeTypes = "primary";

  @Input()
  get maxItems(): number | null {
    return this._maxItems;
  }

  set maxItems(value: number | null) {
    this._maxItems = value == null ? null : Math.max(1, value);
    this.updateFilteredItems();
  }

  @Input()
  get items(): string[] {
    return this._items;
  }

  set items(value: string[]) {
    this._items = value;
    this.updateFilteredItems();
  }

  protected get isFiltered(): boolean {
    return this._items.length > this.filteredItems.length;
  }

  private updateFilteredItems() {
    if (this.maxItems == null) {
      this.filteredItems = this._items;
    } else {
      this.filteredItems = this._items.slice(0, this.maxItems);
    }
  }
}

import { Directive, EventEmitter, Input, Output } from "@angular/core";

import { VaultFilter } from "../models/vault-filter.model";
import { CipherStatus } from "../models/vault-filter.type";

@Directive()
export class StatusFilterComponent {
  @Input() hideFavorites = false;
  @Input() hideTrash = false;
  @Output() onFilterChange: EventEmitter<VaultFilter> = new EventEmitter<VaultFilter>();
  @Input() activeFilter: VaultFilter;

  get show() {
    return !(this.hideFavorites && this.hideTrash);
  }

  applyFilter(cipherStatus: CipherStatus) {
    this.activeFilter.resetFilter();
    this.activeFilter.status = cipherStatus;
    this.onFilterChange.emit(this.activeFilter);
  }
}

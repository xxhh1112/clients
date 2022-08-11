import { Directive, EventEmitter, Input, Output } from "@angular/core";

import { TreeNode } from "@bitwarden/common/models/domain/treeNode";

import { VaultFilterSection, VaultFilterType } from "../models/vault-filter-section";
import { VaultFilter } from "../models/vault-filter.model";

@Directive()
export class FilterSectionComponent {
  @Input() activeFilter: VaultFilter;
  @Output() activeFilterChange = new EventEmitter<VaultFilter>();

  @Input() vaultFilterSection: VaultFilterSection;
  @Output() vaultFilterSectionChange = new EventEmitter<VaultFilterSection>();

  get filterHeader() {
    return this.vaultFilterSection.tree;
  }

  get filterTree() {
    return this.vaultFilterSection.tree.children;
  }

  onFilterSelect(filterNode: TreeNode<VaultFilterType>) {
    this.activeFilter = this.vaultFilterSection.action(this.activeFilter, filterNode.node);
    this.activeFilterChange.emit(this.activeFilter);
  }

  get showEdit() {
    return this.vaultFilterSection.edit.enabled;
  }

  async onEdit(filterNode: TreeNode<VaultFilterType>) {
    await this.vaultFilterSection.edit.action(filterNode.node);
  }

  get showAdd() {
    return this.vaultFilterSection.add.enabled;
  }

  async onAdd() {
    await this.vaultFilterSection.add.action();
  }
}

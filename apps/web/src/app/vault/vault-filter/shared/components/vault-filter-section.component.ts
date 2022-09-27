import { Component, EventEmitter, InjectionToken, Injector, Input, Output } from "@angular/core";

import { Organization } from "@bitwarden/common/models/domain/organization";
import { ITreeNodeObject, TreeNode } from "@bitwarden/common/models/domain/treeNode";

import { VaultFilterSection, VaultFilterType } from "../models/vault-filter-section.type";
import { VaultFilter } from "../models/vault-filter.model";

@Component({
  selector: "app-filter-section",
  templateUrl: "vault-filter-section.component.html",
})
export class VaultFilterSectionComponent {
  @Input() activeFilter: VaultFilter;

  @Input() data: TreeNode<VaultFilterType>;
  @Input() header: VaultFilterSection["header"];
  @Input() action: VaultFilterSection["action"];
  @Input() edit?: VaultFilterSection["edit"];
  @Input() add?: VaultFilterSection["add"];
  @Input() options?: VaultFilterSection["options"];
  @Input() divider?: boolean;
  @Input() nodeCollapsedState: Set<string>;
  @Output() nodeCollapsedStateChange = new EventEmitter<ITreeNodeObject>();

  private injectors = new Map<string, Injector>();

  constructor(private injector: Injector) {}

  get filterHeader() {
    return this.data;
  }

  get filters() {
    return this.data?.children;
  }

  get isOrganizationFilter() {
    return this.data.node instanceof Organization;
  }

  get isAllVaultsSelected() {
    return this.isOrganizationFilter && !this.activeFilter.selectedOrganizationNode;
  }

  isNodeSelected(filterNode: TreeNode<VaultFilterType>) {
    if (this.isOrganizationFilter) {
      return this.activeFilter.organizationId === filterNode?.node.id;
    }
    return (
      this.activeFilter.cipherTypeId === filterNode?.node.id ||
      this.activeFilter.folderId === filterNode?.node.id ||
      this.activeFilter.collectionId === filterNode?.node.id
    );
  }

  async onFilterSelect(filterNode: TreeNode<VaultFilterType>) {
    await this.action(filterNode);
  }

  get showEdit() {
    return this.edit;
  }

  async onEdit(filterNode: TreeNode<VaultFilterType>) {
    await this.edit?.action(filterNode.node);
  }

  get showAddButton() {
    return this.add && !this.add.route;
  }

  get showAddLink() {
    return this.add && this.add.route;
  }

  async onAdd() {
    await this.add?.action();
  }

  get showOptions() {
    return this.options;
  }

  isCollapsed(node: ITreeNodeObject) {
    return this.nodeCollapsedState.has(node.id);
  }

  async toggleCollapse(node: ITreeNodeObject) {
    this.nodeCollapsedStateChange.emit(node);
  }

  // an injector is necessary to pass data into a dynamic component
  // here we are creating a new injector for each filter that has options
  createInjector(data: VaultFilterType) {
    let inject = this.injectors.get(data.id);
    if (!inject) {
      inject = Injector.create({
        providers: [{ provide: OptionsInput, useValue: data }],
        parent: this.injector,
      });
      this.injectors.set(data.id, inject);
    }
    return inject;
  }
}
export const OptionsInput = new InjectionToken<VaultFilterType>("OptionsInput");

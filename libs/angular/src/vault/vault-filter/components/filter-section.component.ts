import {
  Directive,
  EventEmitter,
  InjectionToken,
  Injector,
  Input,
  OnInit,
  Output,
} from "@angular/core";

import { Organization } from "@bitwarden/common/models/domain/organization";
import { ITreeNodeObject, TreeNode } from "@bitwarden/common/models/domain/treeNode";

import { VaultFilterSection, VaultFilterType } from "../models/vault-filter-section";
import { VaultFilter } from "../models/vault-filter.model";

@Directive()
export class FilterSectionComponent implements OnInit {
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

  async ngOnInit() {
    if (this.header.defaultSelection) {
      await this.onFilterSelect(this.filterHeader);
    }
  }

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
      return this.activeFilter.selectedOrganizationNode == filterNode;
    }
    return (
      this.activeFilter.selectedCipherTypeNode == filterNode ||
      this.activeFilter.selectedFolderNode == filterNode ||
      this.activeFilter.selectedCollectionNode == filterNode
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

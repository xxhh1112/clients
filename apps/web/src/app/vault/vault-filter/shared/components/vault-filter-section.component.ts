import { Component, InjectionToken, Injector, Input, OnDestroy } from "@angular/core";
import { Subject, takeUntil } from "rxjs";

import { Organization } from "@bitwarden/common/models/domain/organization";
import { ITreeNodeObject, TreeNode } from "@bitwarden/common/models/domain/treeNode";

import { VaultFilterService } from "../../services/abstractions/vault-filter.service";
import { VaultFilterSection, VaultFilterType } from "../models/vault-filter-section.type";
import { VaultFilter } from "../models/vault-filter.model";

@Component({
  selector: "app-filter-section",
  templateUrl: "vault-filter-section.component.html",
})
export class VaultFilterSectionComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  private _section: VaultFilterSection;

  @Input() activeFilter: VaultFilter;
  @Input() set section(value: VaultFilterSection) {
    if (value && value !== this._section) {
      this._section = value;
      this._section?.data$?.pipe(takeUntil(this.destroy$)).subscribe((data) => {
        this.data = data;
      });
    }
  }

  data: TreeNode<VaultFilterType>;
  collapsedFilterNodes: Set<string> = new Set();

  private injectors = new Map<string, Injector>();

  constructor(private vaultFilterService: VaultFilterService, private injector: Injector) {
    this.vaultFilterService.collapsedFilterNodes$
      .pipe(takeUntil(this.destroy$))
      .subscribe((nodes) => {
        this.collapsedFilterNodes = nodes;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get headerNode() {
    return this.data;
  }

  get headerInfo() {
    return this._section.header;
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
    await this._section?.action(filterNode);
  }

  get editInfo() {
    return this._section?.edit;
  }

  onEdit(filterNode: TreeNode<VaultFilterType>) {
    this._section?.edit?.action(filterNode.node);
  }

  get addInfo() {
    return this._section.add;
  }

  get showAddButton() {
    return this._section.add && !this._section.add.route;
  }

  get showAddLink() {
    return this._section.add && this._section.add.route;
  }

  async onAdd() {
    this._section?.add?.action();
  }

  get optionsInfo() {
    return this._section?.options;
  }

  isCollapsed(node: ITreeNodeObject) {
    return this.collapsedFilterNodes.has(node.id);
  }

  async toggleCollapse(node: ITreeNodeObject) {
    if (this.collapsedFilterNodes.has(node.id)) {
      this.collapsedFilterNodes.delete(node.id);
    } else {
      this.collapsedFilterNodes.add(node.id);
    }
    await this.vaultFilterService.storeCollapsedFilterNodes(this.collapsedFilterNodes);
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

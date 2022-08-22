import { Directive, EventEmitter, Input, OnInit, Output } from "@angular/core";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { VaultFilterService } from "@bitwarden/common/abstractions/vault-filter.service";
import { ITreeNodeObject, TreeNode } from "@bitwarden/common/models/domain/treeNode";

import { OrganizationFilter } from "../models/organization-filter.model";
import { VaultFilterList } from "../models/vault-filter-section";
import { VaultFilter } from "../models/vault-filter.model";

@Directive()
export class VaultFilterComponent implements OnInit {
  @Input() activeFilter: VaultFilter = new VaultFilter();
  @Output() activeFilterChanged = new EventEmitter<VaultFilter>();
  @Input() filters?: VaultFilterList;

  isLoaded = false;
  collapsedFilterNodes: Set<string>;

  constructor(
    protected vaultFilterService: VaultFilterService,
    protected i18nService: I18nService,
    protected platformUtilsService: PlatformUtilsService
  ) {}

  async ngOnInit(): Promise<void> {
    this.collapsedFilterNodes = await this.vaultFilterService.buildCollapsedFilterNodes();
    this.vaultFilterService.collapsedFilterNodes$.subscribe((nodes) => {
      this.collapsedFilterNodes = nodes;
    });

    this.isLoaded = true;
  }

  get filtersList() {
    return this.filters ? Object.values(this.filters) : [];
  }

  async toggleFilterNodeCollapseState(node: ITreeNodeObject) {
    if (this.collapsedFilterNodes.has(node.id)) {
      this.collapsedFilterNodes.delete(node.id);
    } else {
      this.collapsedFilterNodes.add(node.id);
    }
    await this.vaultFilterService.storeCollapsedFilterNodes(this.collapsedFilterNodes);
  }

  async reloadOrganizations() {
    if (this.filters) {
      this.filters.organizationFilter.data$ =
        await this.vaultFilterService.buildNestedOrganizations();
    }
  }

  // TODO: Remove when collections is refactored with observables
  async reloadCollections(orgNode?: TreeNode<OrganizationFilter>) {
    this.vaultFilterService.updateCollections();
  }

  protected async applyVaultFilter(filter: VaultFilter) {
    this.activeFilterChanged.emit(filter);
  }

  applyOrganizationFilter = async (orgNode: TreeNode<OrganizationFilter>): Promise<void> => {
    if (!orgNode.node.enabled) {
      return;
    }
    const filter = this.activeFilter;
    filter.resetOrganization();
    await this.reloadCollections(orgNode);

    await this.applyVaultFilter(filter);
  };
}

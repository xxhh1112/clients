import { Directive, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { Subject, takeUntil } from "rxjs";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { VaultFilterService } from "@bitwarden/common/abstractions/vault-filter.service";
import { ITreeNodeObject, TreeNode } from "@bitwarden/common/models/domain/treeNode";

import { OrganizationFilter } from "../models/organization-filter.model";
import { VaultFilterList } from "../models/vault-filter-section";
import { VaultFilter } from "../models/vault-filter.model";

@Directive()
export class VaultFilterComponent implements OnInit, OnDestroy {
  @Input() activeFilter: VaultFilter = new VaultFilter();
  @Output() activeFilterChanged = new EventEmitter<VaultFilter>();
  @Input() filters?: VaultFilterList;

  isLoaded = false;
  collapsedFilterNodes: Set<string>;

  destroy$: Subject<void>;

  constructor(
    protected vaultFilterService: VaultFilterService,
    protected i18nService: I18nService,
    protected platformUtilsService: PlatformUtilsService
  ) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async ngOnInit(): Promise<void> {
    this.collapsedFilterNodes = await this.vaultFilterService.buildCollapsedFilterNodes();
    this.vaultFilterService.collapsedFilterNodes$
      .pipe(takeUntil(this.destroy$))
      .subscribe((nodes) => {
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
  async reloadCollections() {
    await this.vaultFilterService.reloadCollections();
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
    filter.selectedOrganizationNode = orgNode;
    this.vaultFilterService.updateOrganizationFilter(orgNode.node);
    await this.reloadCollections();

    await this.applyVaultFilter(filter);
  };
}

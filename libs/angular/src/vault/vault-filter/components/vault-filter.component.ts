import { Directive, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Observable } from "rxjs";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { VaultFilterService } from "@bitwarden/common/abstractions/vault-filter.service";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { ITreeNodeObject, TreeNode } from "@bitwarden/common/models/domain/treeNode";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";
import { FolderView } from "@bitwarden/common/models/view/folderView";

import { DynamicTreeNode } from "../models/dynamic-tree-node.model";
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
  organizations: Organization[];
  collections: DynamicTreeNode<CollectionView>;
  folders$: Observable<DynamicTreeNode<FolderView>>;

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

  async reloadCollections(orgNode?: TreeNode<OrganizationFilter>) {
    if (this.filters) {
      if (!orgNode || orgNode.node.id === "AllVaults") {
        this.activeFilter.selectedOrganizationNode = null;
        this.filters.collectionFilter.data$ = await this.vaultFilterService.buildCollections();
      } else {
        this.activeFilter.selectedOrganizationNode = orgNode;
        this.filters.collectionFilter.data$ = await this.vaultFilterService.buildCollections(
          orgNode.node
        );
      }
    }
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

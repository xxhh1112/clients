import { Directive, Input, OnInit } from "@angular/core";
import { Observable } from "rxjs";

import { Organization } from "@bitwarden/common/models/domain/organization";
import { ITreeNodeObject } from "@bitwarden/common/models/domain/treeNode";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";
import { FolderView } from "@bitwarden/common/models/view/folderView";

import { DynamicTreeNode } from "../models/dynamic-tree-node.model";
import { VaultFilterList } from "../models/vault-filter-section";
import { VaultFilter } from "../models/vault-filter.model";
import { VaultFilterService } from "../services/vault-filter.service";

@Directive()
export class VaultFilterComponent implements OnInit {
  @Input() activeFilter: VaultFilter = new VaultFilter();
  @Input() filters?: VaultFilterList;

  isLoaded = false;
  collapsedFilterNodes: Set<string>;
  organizations: Organization[];
  collections: DynamicTreeNode<CollectionView>;
  folders$: Observable<DynamicTreeNode<FolderView>>;

  constructor(protected vaultFilterService: VaultFilterService) {}

  async ngOnInit(): Promise<void> {
    this.collapsedFilterNodes = await this.vaultFilterService.buildCollapsedFilterNodes();
    // this.organizations = await this.vaultFilterService.buildOrganizations();
    // if (this.organizations != null && this.organizations.length > 0) {
    //   this.activePersonalOwnershipPolicy =
    //     await this.vaultFilterService.checkForPersonalOwnershipPolicy();
    //   this.activeSingleOrganizationPolicy =
    //     await this.vaultFilterService.checkForSingleOrganizationPolicy();
    // }
    // this.folders$ = await this.vaultFilterService.buildNestedFolders();
    // this.collections = await this.initCollections();
    this.isLoaded = true;
  }

  async toggleFilterNodeCollapseState(node: ITreeNodeObject) {
    if (this.collapsedFilterNodes.has(node.id)) {
      this.collapsedFilterNodes.delete(node.id);
    } else {
      this.collapsedFilterNodes.add(node.id);
    }
    await this.vaultFilterService.storeCollapsedFilterNodes(this.collapsedFilterNodes);
  }

  async reloadCollections(filter: VaultFilter) {
    this.filters.collectionFilter.data$ = filter.myVaultOnly
      ? null
      : await this.vaultFilterService.buildCollections(filter.selectedOrganizationId);
  }

  async reloadOrganizations() {
    this.filters.organizationFilter.data$ = await this.vaultFilterService.buildOrganizations();
  }

  protected async pruneInvalidatedFilterSelections(filter: VaultFilter): Promise<VaultFilter> {
    filter = await this.pruneInvalidFolderSelection(filter);
    filter = this.pruneInvalidCollectionSelection(filter);
    return filter;
  }

  protected async pruneInvalidFolderSelection(filter: VaultFilter): Promise<VaultFilter> {
    // if (
    //   filter.selectedFolder &&
    //   !(await firstValueFrom(this.folders$))?.hasId(filter.selectedFolderId)
    // ) {
    //   filter.selectedFolder = false;
    //   filter.selectedFolderId = null;
    // }
    return filter;
  }

  protected pruneInvalidCollectionSelection(filter: VaultFilter): VaultFilter {
    // if (
    //   filter.myVaultOnly ||
    //   (filter.selectedCollection &&
    //     filter.selectedCollectionId != null &&
    //     !this.collections?.hasId(filter.selectedCollectionId))
    // ) {
    //   filter.selectedCollection = false;
    //   filter.selectedCollectionId = null;
    // }
    return filter;
  }
}

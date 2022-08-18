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

  async reloadOrganizations() {
    this.filters.organizationFilter.data$ =
      await this.vaultFilterService.buildNestedOrganizations();
  }
}

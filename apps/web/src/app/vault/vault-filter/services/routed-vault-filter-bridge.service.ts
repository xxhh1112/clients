import { Injectable } from "@angular/core";
import { combineLatest, map, Observable } from "rxjs";

import { ITreeNodeObject, TreeNode } from "@bitwarden/common/models/domain/tree-node";

import { RoutedVaultFilterService } from "../../../core/vault-filter/routed-vault-filter.service";
import { VaultFilter } from "../shared/models/vault-filter.model";

import { VaultFilterService } from "./abstractions/vault-filter.service";

@Injectable()
export class RoutedVaultFilterBridgeService {
  readonly activeFilter$: Observable<VaultFilter>;

  constructor(
    routedVaultFilterService: RoutedVaultFilterService,
    legacyVaultFilterService: VaultFilterService
  ) {
    this.activeFilter$ = combineLatest([
      routedVaultFilterService.filter$,
      legacyVaultFilterService.collectionTree$,
      legacyVaultFilterService.folderTree$,
      legacyVaultFilterService.organizationTree$,
    ]).pipe(
      map(([filter, collectionTree, folderTree, organizationTree]) => {
        const legacyFilter = new VaultFilter();

        if (filter.collectionId !== undefined) {
          legacyFilter.selectedCollectionNode = this.findNode(collectionTree, filter.collectionId);
        }

        if (filter.folderId !== undefined) {
          legacyFilter.selectedFolderNode = this.findNode(folderTree, filter.folderId);
        }

        if (filter.organizationId !== undefined) {
          legacyFilter.selectedOrganizationNode = this.findNode(
            organizationTree,
            filter.organizationId
          );
        }

        return legacyFilter;
      })
    );

    this.activeFilter$.subscribe();
  }

  private findNode<T extends ITreeNodeObject>(
    node: TreeNode<T>,
    id: string
  ): TreeNode<T> | undefined {
    if (node.node.id === id) {
      return node;
    }

    for (const child of node.children) {
      const result = this.findNode(child, id);
      if (result !== undefined) {
        return result;
      }
    }

    return undefined;
  }
}

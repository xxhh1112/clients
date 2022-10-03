import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { firstValueFrom, Subject, switchMap, takeUntil } from "rxjs";

import { Organization } from "@bitwarden/common/models/domain/organization";
import { TreeNode } from "@bitwarden/common/models/domain/treeNode";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";

import { VaultFilterComponent as BaseVaultFilterComponent } from "../../../vault/vault-filter/components/vault-filter.component";
import {
  VaultFilterList,
  VaultFilterType,
} from "../../../vault/vault-filter/shared/models/vault-filter-section.type";
import { CollectionFilter } from "../../../vault/vault-filter/shared/models/vault-filter.type";

@Component({
  selector: "app-organization-vault-filter",
  templateUrl: "../../../vault/vault-filter/components/vault-filter.component.html",
})
export class VaultFilterComponent extends BaseVaultFilterComponent implements OnInit, OnDestroy {
  @Input() set organization(value: Organization) {
    if (value && value !== this._organization) {
      if (!this._organization) {
        this.initCollections(value);
      }
      this._organization = value;
      this.vaultFilterService.updateOrganizationFilter(this._organization);
    }
  }
  _organization: Organization;
  destroy$: Subject<void>;

  // override to allow for async init when org loads
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async ngOnInit() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async initCollections(org: Organization) {
    await this.buildAllFilters();
    if (!this.activeFilter.selectedCipherTypeNode) {
      this.applyCollectionFilter((await this.getDefaultFilter()) as TreeNode<CollectionFilter>);
    }
    this.isLoaded = true;
  }

  protected loadSubscriptions() {
    this.vaultFilterService.filteredCollections$
      .pipe(
        switchMap(async (collections) => {
          this.removeInvalidCollectionSelection(collections);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  protected async removeInvalidCollectionSelection(collections: CollectionView[]) {
    if (this.activeFilter.selectedCollectionNode) {
      if (!collections.some((f) => f.id === this.activeFilter.collectionId)) {
        this.activeFilter.resetFilter();
        this.activeFilter.selectedCollectionNode =
          (await this.getDefaultFilter()) as TreeNode<CollectionFilter>;
        this.applyVaultFilter(this.activeFilter);
      }
    }
  }

  async buildAllFilters() {
    this.vaultFilterService.updateOrganizationFilter(this._organization);

    const builderFilter = {} as VaultFilterList;
    builderFilter.typeFilter = await this.addTypeFilter();
    builderFilter.collectionFilter = await this.addCollectionFilter();
    builderFilter.trashFilter = await this.addTrashFilter();

    this.filters = builderFilter;
  }

  async getDefaultFilter(): Promise<TreeNode<VaultFilterType>> {
    return await firstValueFrom(this.filters?.collectionFilter.data$);
  }
}

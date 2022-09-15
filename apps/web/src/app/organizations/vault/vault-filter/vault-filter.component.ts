import { Component, OnDestroy } from "@angular/core";
import { firstValueFrom, Subject, switchMap, takeUntil } from "rxjs";

import { CollectionFilter } from "@bitwarden/angular/vault/vault-filter/models/cipher-filter.model";
import { VaultFilterList } from "@bitwarden/angular/vault/vault-filter/models/vault-filter-section";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { TreeNode } from "@bitwarden/common/models/domain/treeNode";

import { VaultFilterComponent as BaseVaultFilterComponent } from "../../../vault/vault-filter/vault-filter.component";

@Component({
  selector: "app-organization-vault-filter",
  templateUrl: "../../../vault/vault-filter/vault-filter.component.html",
})
export class VaultFilterComponent extends BaseVaultFilterComponent implements OnDestroy {
  private _organization: Organization;

  destroy$: Subject<void>;

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected loadSubscriptions() {
    this.vaultFilterService.filteredCollections$
      .pipe(
        switchMap(async (collections) => {
          this.currentFilterCollections = collections;
          if (this.activeFilter.selectedCollectionNode) {
            if (!collections.find((f) => f.id === this.activeFilter.getCollectionId)) {
              const filter = this.activeFilter;
              filter.resetFilter();
              filter.selectedCollectionNode = (await firstValueFrom(
                this.filters?.collectionFilter.data$
              )) as TreeNode<CollectionFilter>;
              await this.applyVaultFilter(filter);
            }
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  async initCollections(org: Organization) {
    this._organization = org;
    await this.reloadCollections();
    this.applyCollectionFilter(
      (await firstValueFrom(this.filters?.collectionFilter.data$)) as TreeNode<CollectionFilter>
    );
  }

  async updateOrganizationFilter(org: Organization) {
    this.vaultFilterService.updateOrganizationFilter(org);
    await this.reloadCollections();
  }

  async reloadCollections() {
    await this.vaultFilterService.reloadCollections();
  }

  async buildAllFilters() {
    this.vaultFilterService.updateOrganizationFilter(this._organization);

    let builderFilter = {} as VaultFilterList;
    builderFilter = await this.addTypeFilter(builderFilter);
    builderFilter = await this.addCollectionFilter(builderFilter);
    builderFilter = await this.addTrashFilter(builderFilter);

    this.filters = builderFilter;
  }
}

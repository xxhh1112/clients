import { Injectable } from "@angular/core";
import { combineLatestWith, map, Observable, ReplaySubject, switchMap, takeUntil } from "rxjs";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { FolderService } from "@bitwarden/common/abstractions/folder/folder.service.abstraction";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { OrganizationService } from "@bitwarden/common/abstractions/organization/organization.service.abstraction";
import { PolicyService } from "@bitwarden/common/abstractions/policy/policy.service.abstraction";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { CollectionGroupDetailsData } from "@bitwarden/common/models/data/collectionData";
import { Collection } from "@bitwarden/common/models/domain/collection";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { TreeNode } from "@bitwarden/common/models/domain/treeNode";
import { CollectionGroupDetailsResponse } from "@bitwarden/common/models/response/collectionResponse";
import {
  CollectionGroupDetailsView,
  CollectionView,
} from "@bitwarden/common/models/view/collectionView";

import { CollectionFilter } from "src/app/vault/vault-filter/shared/models/vault-filter.type";

import { VaultFilterService as BaseVaultFilterService } from "../../../vault/vault-filter/services/vault-filter.service";

@Injectable()
export class VaultFilterService extends BaseVaultFilterService {
  protected collectionViews$ = new ReplaySubject<CollectionView[]>(1);

  nestedCollections$: Observable<TreeNode<CollectionFilter>> = this.filteredCollections$.pipe(
    map((collections) => this.buildCollectionTree(collections))
  );

  constructor(
    stateService: StateService,
    organizationService: OrganizationService,
    folderService: FolderService,
    cipherService: CipherService,
    collectionService: CollectionService,
    policyService: PolicyService,
    protected apiService: ApiService,
    i18nService: I18nService
  ) {
    super(
      stateService,
      organizationService,
      folderService,
      cipherService,
      collectionService,
      policyService,
      i18nService
    );
  }

  protected loadSubscriptions() {
    this.folderService.folderViews$
      .pipe(
        combineLatestWith(this._organizationFilter),
        switchMap(async ([folders, org]) => {
          return this.filterFolders(folders, org);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(this._filteredFolders);

    this._organizationFilter
      .pipe(
        switchMap((org) => {
          return this.loadCollections(org);
        })
      )
      .subscribe(this.collectionViews$);

    this.collectionViews$
      .pipe(
        combineLatestWith(this._organizationFilter),
        switchMap(async ([collections, org]) => {
          if (org?.canUseAdminCollections) {
            return collections;
          } else {
            return await this.filterCollections(collections, org);
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(this._filteredCollections);
  }

  protected async loadCollections(org: Organization) {
    if (org?.permissions && org?.canEditAnyCollection) {
      return await this.loadAdminCollections(org);
    } else {
      // TODO: remove when collections is refactored with observables
      return await this.collectionService.getAllDecrypted();
    }
  }

  async loadAdminCollections(org: Organization): Promise<CollectionGroupDetailsView[]> {
    let collections: CollectionGroupDetailsView[] = [];
    if (org?.permissions && org?.canEditAnyCollection) {
      const collectionResponse = await this.apiService.getCollectionsWithDetails(org.id);
      if (collectionResponse?.data != null && collectionResponse.data.length) {
        const collectionDomains = collectionResponse.data.map(
          (r: CollectionGroupDetailsResponse) => new Collection(new CollectionGroupDetailsData(r))
        );
        const decCollections = await this.collectionService.decryptMany(collectionDomains);
        collections = decCollections.map((c) => {
          const view = new CollectionGroupDetailsView(c);
          view.groups = collectionResponse.data.find((x) => x.id === c.id).groups;
          return view;
        });
      }

      const noneCollection = new CollectionGroupDetailsView();
      noneCollection.name = this.i18nService.t("unassigned");
      noneCollection.organizationId = org.id;
      collections.push(noneCollection);
    }
    return collections;
  }
}

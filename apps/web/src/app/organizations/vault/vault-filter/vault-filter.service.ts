import { Injectable, OnDestroy } from "@angular/core";
import { filter, map, Observable, ReplaySubject, Subject, switchMap, takeUntil } from "rxjs";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { FolderService } from "@bitwarden/common/abstractions/folder/folder.service.abstraction";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { OrganizationService } from "@bitwarden/common/abstractions/organization/organization.service.abstraction";
import { PolicyService } from "@bitwarden/common/abstractions/policy/policy.service.abstraction";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { CollectionGroupDetailsData } from "@bitwarden/common/models/data/collection.data";
import { Collection } from "@bitwarden/common/models/domain/collection";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { TreeNode } from "@bitwarden/common/models/domain/tree-node";
import { CollectionGroupDetailsResponse } from "@bitwarden/common/models/response/collection.response";
import {
  CollectionGroupDetailsView,
  CollectionView,
} from "@bitwarden/common/models/view/collection.view";

import { VaultFilterService as BaseVaultFilterService } from "../../../vault/vault-filter/services/vault-filter.service";
import { CollectionFilter } from "../../../vault/vault-filter/shared/models/vault-filter.type";

@Injectable()
export class VaultFilterService extends BaseVaultFilterService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private _collections = new ReplaySubject<CollectionGroupDetailsView[]>(1);

  filteredCollections$: Observable<CollectionView[]> = this._collections.asObservable();

  collectionTree$: Observable<TreeNode<CollectionFilter>> = this.filteredCollections$.pipe(
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
    this.loadSubscriptions();
  }

  protected loadSubscriptions() {
    this._organizationFilter
      .pipe(
        filter((org) => org != null),
        switchMap((org) => {
          return this.loadCollections(org);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((collections) => {
        this._collections.next(collections);
      });
  }

  async reloadCollections() {
    this._collections.next(await this.loadCollections(this._organizationFilter.getValue()));
  }

  protected async loadCollections(org: Organization): Promise<CollectionGroupDetailsView[]> {
    let collections: CollectionGroupDetailsView[] = [];
    if (org?.permissions && org?.canViewAssignedCollections) {
      const collectionResponse = await this.apiService.getManyCollectionsWithDetails(org.id);
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

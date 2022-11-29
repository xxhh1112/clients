import { Injectable } from "@angular/core";
import { combineLatest, map, Observable } from "rxjs";

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
        return new VaultFilter();
      })
    );
  }
}

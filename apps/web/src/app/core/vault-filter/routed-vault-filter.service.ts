import { Injectable, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { combineLatest, map, Observable, Subject, takeUntil, tap } from "rxjs";

import { RoutedVaultFilterModel } from "./routed-vault-filter.model";

@Injectable()
export class RoutedVaultFilterService implements OnDestroy {
  private onDestroy = new Subject<void>();

  filter$: Observable<RoutedVaultFilterModel>;

  constructor(activatedRoute: ActivatedRoute) {
    this.filter$ = combineLatest([activatedRoute.paramMap, activatedRoute.queryParamMap]).pipe(
      map(([params, queryParams]) => {
        return {
          collectionId: queryParams.get("collectionId") ?? undefined,
          folderId: queryParams.get("folderId") ?? undefined,
          organizationId: params.get("organizationId") ?? undefined,
        };
      }),
      // eslint-disable-next-line no-console
      tap((filter) => console.log("RoutedVaultFilterService.filter", filter)),
      takeUntil(this.onDestroy)
    );
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }
}

import { Injectable, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { map, Observable, Subject, takeUntil, tap } from "rxjs";

import { NewVaultFilterModel } from "./vault-filter.model";

@Injectable()
export class RoutedVaultFilterService implements OnDestroy {
  private onDestroy = new Subject<void>();

  filter$: Observable<NewVaultFilterModel>;

  constructor(activatedRoute: ActivatedRoute) {
    this.filter$ = activatedRoute.queryParamMap.pipe(
      map((params) => {
        return {
          collectionId: params.get("collectionId"),
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

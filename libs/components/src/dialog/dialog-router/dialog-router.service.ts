import { DialogRef } from "@angular/cdk/dialog";
import { Injectable, OnDestroy } from "@angular/core";
import { Router, RoutesRecognized } from "@angular/router";
import {
  distinct,
  EMPTY,
  filter,
  map,
  pairwise,
  startWith,
  Subject,
  switchMap,
  takeUntil,
} from "rxjs";

import { DialogService } from "../dialog.service";

export const DialogOutlet = "dialog";

@Injectable()
export class DialogRouterService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private currentDialog?: DialogRef;

  constructor(router: Router, dialogService: DialogService) {
    router.events
      .pipe(
        filter<RoutesRecognized>((e) => e instanceof RoutesRecognized),
        map(
          (e) =>
            e?.state?.root?.children.find((c) => c.outlet === DialogOutlet)?.children[0]
              ?.children[0]?.component
        ),
        startWith(undefined),
        pairwise(),
        distinct(),
        switchMap(([previous, current]) => {
          if (previous != undefined && !this.currentDialog.closed) {
            this.currentDialog.close();
          }

          if (current != undefined) {
            this.currentDialog = dialogService.open(current);
            return this.currentDialog.closed;
          }

          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        router.navigate([".", { outlets: { dialog: null } }]);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

import { Injectable, Optional, SkipSelf } from "@angular/core";
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  first,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
} from "rxjs";

import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { ValidationService } from "@bitwarden/common/platform/abstractions/validation.service";

import { FunctionReturningAwaitable, functionToObservable } from "../utils/function-to-observable";

import { BitAsyncTag } from "./bit-async-tag";

export type BitAsyncAction = { handler: FunctionReturningAwaitable; tag?: BitAsyncTag };

@Injectable()
export class AsyncContextService {
  private destroy$ = new Subject<void>();

  private _requestedAction$ = new Subject<BitAsyncAction>();
  private _currentAction$ = new BehaviorSubject<BitAsyncAction | undefined>(undefined);
  private _selfLoading$ = new BehaviorSubject<boolean>(false);
  private _selfDisabled$ = new BehaviorSubject<boolean>(false);

  readonly currentAction$ = this._currentAction$.asObservable();
  readonly disabled$: Observable<boolean>;
  readonly loading$: Observable<boolean>;

  constructor(
    @Optional() @SkipSelf() parentContext?: AsyncContextService,
    validationService?: ValidationService,
    @Optional() logService?: LogService
  ) {
    if (parentContext) {
      this.disabled$ = combineLatest({
        parentDisabled: parentContext.disabled$,
        selfDisabled: this._selfDisabled$,
      }).pipe(map(({ parentDisabled, selfDisabled }) => parentDisabled || selfDisabled));

      this.loading$ = combineLatest({
        parentLoading: parentContext.loading$,
        selfLoading: this._selfLoading$,
      }).pipe(map(({ parentLoading, selfLoading }) => parentLoading || selfLoading));
    } else {
      this.disabled$ = this._selfDisabled$.asObservable();
      this.loading$ = this._selfLoading$.asObservable();
    }

    this._requestedAction$
      .pipe(
        switchMap((action) =>
          combineLatest({
            action: of(action),
            disabled: this.disabled$.pipe(first()),
            loading: this.loading$.pipe(first()),
          })
        ),
        filter(({ disabled, loading }) => !disabled && !loading),
        switchMap(({ action }) => {
          this._selfLoading$.next(true);
          this._currentAction$.next(action);

          const awaitable = functionToObservable(action.handler);
          return awaitable.pipe(
            catchError((err: unknown) => {
              logService?.error(`Async action exception: ${err}`);
              validationService?.showError(err);
              return of(undefined);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this._selfLoading$.next(false);
          this._currentAction$.next(undefined);
        },
        complete: () => {
          this._selfLoading$.next(false);
          this._currentAction$.next(undefined);
        },
      });
  }

  private get disabled() {
    return this._selfDisabled$.value;
  }

  private set disabled(value: boolean) {
    this._selfDisabled$.next(value);
  }

  get loading() {
    return this._selfLoading$.value;
  }

  set loading(value: boolean) {
    this._selfLoading$.next(value);
  }

  run(tag: BitAsyncTag, handler: FunctionReturningAwaitable): void;
  run(handler: FunctionReturningAwaitable): void;
  run(
    tagOrHandler: BitAsyncTag | FunctionReturningAwaitable,
    handler?: FunctionReturningAwaitable
  ): void {
    if (typeof tagOrHandler === "function") {
      this._requestedAction$.next({ handler: tagOrHandler });
      return;
    }

    this._requestedAction$.next({ handler, tag: tagOrHandler });
  }
}

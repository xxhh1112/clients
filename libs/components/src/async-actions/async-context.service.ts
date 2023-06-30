import { Injectable, Optional } from "@angular/core";
import { BehaviorSubject, catchError, filter, of, Subject, switchMap, takeUntil } from "rxjs";

import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { ValidationService } from "@bitwarden/common/platform/abstractions/validation.service";

import { FunctionReturningAwaitable, functionToObservable } from "../utils/function-to-observable";

@Injectable()
export class AsyncContextService {
  private destroy$ = new Subject<void>();

  private _requestedAction$ = new Subject<FunctionReturningAwaitable>();
  private _currentAction$ = new BehaviorSubject<FunctionReturningAwaitable | undefined>(undefined);
  private _loading$ = new BehaviorSubject<boolean>(false);
  private _disabled$ = new BehaviorSubject<boolean>(false);

  readonly currentAction$ = this._currentAction$.asObservable();
  readonly disabled$ = this._disabled$.asObservable();
  readonly loading$ = this._loading$.asObservable();

  constructor(
    @Optional() validationService?: ValidationService,
    @Optional() logService?: LogService
  ) {
    this._requestedAction$
      .pipe(
        filter(() => !this.disabled && !this.loading),
        switchMap((action) => {
          this._loading$.next(true);
          this._currentAction$.next(action);

          const awaitable = functionToObservable(action);
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
          this._loading$.next(false);
          this._currentAction$.next(undefined);
        },
        complete: () => {
          this._loading$.next(false);
          this._currentAction$.next(undefined);
        },
      });
  }

  private get disabled() {
    return this._disabled$.value;
  }

  private set disabled(value: boolean) {
    this._disabled$.next(value);
  }

  get loading() {
    return this._loading$.value;
  }

  set loading(value: boolean) {
    this._loading$.next(value);
  }

  run(action: FunctionReturningAwaitable) {
    this._requestedAction$.next(action);
  }
}

import { BehaviorSubject, ReplaySubject, switchMap } from "rxjs";

export class ClearableBitSubject<T = never> {
  private _outerSubject = new BehaviorSubject(new ReplaySubject<T>(1));

  private observable$ = this._outerSubject.pipe(switchMap((current) => current));

  reset() {
    this._outerSubject.next(new ReplaySubject(1));
  }

  next(value: T): void {
    this._outerSubject.value.next(value);
  }

  asObservable() {
    return this.observable$;
  }
}

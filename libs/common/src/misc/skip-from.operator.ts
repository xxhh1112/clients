import { MonoTypeOperatorFunction, Observable } from "rxjs";

export function skipFrom<T>(
  skipSource: Observable<number>,
  initialSkip = 0
): MonoTypeOperatorFunction<T> {
  let skip = initialSkip;
  const innerSubscription = skipSource.subscribe((value) => {
    skip = value;
  });

  return function <T>(source: Observable<T>) {
    return new Observable<T>((subscriber) => {
      source.subscribe({
        next(value) {
          if (skip > 0) {
            skip -= 1;
          } else {
            subscriber.next(value);
          }
        },
        error(err: unknown) {
          innerSubscription.unsubscribe();
          subscriber.error(err);
        },
        complete() {
          innerSubscription.unsubscribe();
          subscriber.complete();
        },
      });
    });
  };
}

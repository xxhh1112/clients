import { filter, map, Observable, OperatorFunction } from "rxjs";

export function fromChromeEvent<T extends unknown[]>(
  event: chrome.events.Event<(...args: T) => void>
) {
  return new Observable<T>((subscriber) => {
    const handler = (...args: T) => subscriber.next(args);

    event.addListener(handler);

    return () => event.removeListener(handler);
  });
}

export function area(
  areaName: chrome.storage.AreaName
): OperatorFunction<
  [changes: { [key: string]: chrome.storage.StorageChange }, areaName: chrome.storage.AreaName],
  { [key: string]: chrome.storage.StorageChange }
> {
  return (source) =>
    source.pipe(
      filter(([_changes, actualAreaName]) => actualAreaName === areaName),
      map(([changes]) => changes)
    );
}

export function storageKey(
  key: string
): OperatorFunction<{ [key: string]: chrome.storage.StorageChange }, chrome.storage.StorageChange> {
  return (source) =>
    source.pipe(
      filter((changes) => key in changes),
      map((changes) => changes[key])
    );
}

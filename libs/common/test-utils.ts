import { Observable, Subscription } from "rxjs";

export async function awaitAsync(ms = 0) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Subscribes to the given observable and updates `marbleValueOut` to a condensed string of marble values */
export function marbleize<T>(observable: Observable<T>): {
  subscription: Subscription;
  marbles: string[];
  values: { [marble: string]: T };
} {
  const marblesOut: string[] = [];
  const valuesOut: { [marble: string]: T } = {};
  return {
    subscription: observable.subscribe((next) => {
      const i = marblesOut.length;
      marblesOut.push(i.toString());
      valuesOut[i.toString()] = JSON.parse(JSON.stringify(next));
    }),
    marbles: marblesOut,
    values: valuesOut,
  };
}

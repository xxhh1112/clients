import { TestScheduler } from "rxjs/testing";

import { skipFrom } from "./skip-from.operator";

describe("skipFrom", () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it("should skip the initialization value", () => {
    testScheduler.run((helpers) => {
      const { cold, expectObservable } = helpers;
      const e1 = cold("                 -a--b--c---|");
      const skipSource = cold<number>(" -----------|");
      const expected = "                ----b--c---|";

      expectObservable(e1.pipe(skipFrom(skipSource, 1))).toBe(expected);
    });
  });

  it("should unsubscribe from the source", () => {
    testScheduler.run((helpers) => {
      const { cold, expectSubscriptions } = helpers;
      const e1 = cold("                 -a--b--c---|");
      const skipSource = cold<number>(" -----------|");
      const e2subs = "                  ^----------!";

      e1.pipe(skipFrom(skipSource, 1)).subscribe().unsubscribe();

      expectSubscriptions(skipSource.subscriptions).toBe(e2subs);
    });
  });

  it("should skip values based on the source", () => {
    testScheduler.run((helpers) => {
      const { cold, expectObservable } = helpers;
      const e1 = cold("                 -a--b--c---|");
      const skipSource = cold<number>(" --1--------|");
      const expected = "                -a-----c---|";

      expectObservable(e1.pipe(skipFrom(skipSource, 0))).toBe(expected);
    });
  });

  it("should update skip values based on the most recent source", () => {
    testScheduler.run((helpers) => {
      const { cold, expectObservable } = helpers;
      const e1 = cold("                 -a--b--c---|");
      const skipSource = cold<number>(" --2--0-----|");
      const expected = "                -a-----c---|";

      expectObservable(e1.pipe(skipFrom(skipSource, 0))).toBe(expected);
    });
  });
});

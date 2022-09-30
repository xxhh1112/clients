import { Subject } from "rxjs";

import { SyncEventArgs } from "../../types/syncEventArgs";

import { SyncNotifierService } from "./syncNotifier.service";

describe("SyncNotifierService", () => {
  let sut: SyncNotifierService;
  let _syncSubject: Subject<SyncEventArgs>;
  const spy = jest.fn();

  beforeEach(() => {
    sut = new SyncNotifierService();
    _syncSubject = (sut as any)["_sync"];
  });

  afterEach(() => {
    _syncSubject.complete();
    spy.mockReset();
  });

  describe("next", () => {
    const eventArgs: SyncEventArgs = { status: "Completed", successfully: false };
    it("should call next on the subject backing sync$", () => {
      sut.sync$.subscribe(spy);
      sut.next(eventArgs);

      expect(spy).toHaveBeenCalledWith(eventArgs);
    });
  });

  describe("sync$", () => {
    it("should emit events", () => {
      sut.sync$.subscribe(spy);
      sut.next({ status: "Completed", successfully: false });

      expect(spy).toHaveBeenCalled();
    });
  });

  describe("syncCompletedSuccessfully$", () => {
    it("should filter incomplete syncs", () => {
      sut.syncCompletedSuccessfully$.subscribe(spy);
      sut.next({ status: "Started" });

      expect(spy).not.toHaveBeenCalled();
    });

    it("should filter failed syncs", () => {
      sut.syncCompletedSuccessfully$.subscribe(spy);
      sut.next({ status: "Completed", successfully: false });

      expect(spy).not.toHaveBeenCalled();
    });

    it("should emit successful syncs", () => {
      sut.syncCompletedSuccessfully$.subscribe(spy);
      sut.next({ status: "Completed", successfully: true, data: {} as any });

      expect(spy).toHaveBeenCalled();
    });
  });
});

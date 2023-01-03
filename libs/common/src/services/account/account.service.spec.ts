import { mock, MockProxy } from "jest-mock-extended";
import { Subscription } from "rxjs";

import { marbleize } from "../../../test-utils";
import { AccountData, InternalAccountService } from "../../abstractions/account/account.service";
import { LogService } from "../../abstractions/log.service";
import { MessagingService } from "../../abstractions/messaging.service";
import { SubjectData } from "../../misc/subject-data";

import { AccountServiceImplementation } from "./account.service";

describe("AccountService", () => {
  let messagingService: MockProxy<MessagingService>;
  let logService: MockProxy<LogService>;
  let sut: InternalAccountService;
  const lockedAccount = { id: "account", unlocked: false };
  const unlockedAccount = { id: "account", unlocked: true };

  beforeEach(() => {
    messagingService = mock();
    logService = mock();

    sut = new AccountServiceImplementation(messagingService, logService);
  });

  afterEach(() => {
    jest.resetAllMocks();
    (sut as any)._accounts.complete();
    (sut as any)._activeAccount.complete();
  });

  describe("delete", () => {
    it("should send logout message", async () => {
      await sut.delete();

      expect(messagingService.send).toBeCalledWith("logout");
    });

    it("should log error", async () => {
      const error = new Error("error");
      messagingService.send.mockImplementation(() => {
        throw error;
      });

      await expect(() => sut.delete()).rejects.toThrowError(error);

      expect(logService.error).toBeCalledWith(error);
    });
  });

  describe("setActiveAccount", () => {
    const account = lockedAccount;

    beforeEach(() => {
      sut.upsertAccount(account);
    });

    it("should set active account background", async () => {
      expect((sut as any)._activeAccount.value).toBeUndefined();

      await sut.setActiveAccount(account.id);
      expect((sut as any)._activeAccount.value).toEqual(account.id);
    });
  });

  describe("account$", () => {
    let marbles: string[];
    let values: { [key: string]: SubjectData<SubjectData<AccountData>[]> };
    let marbleizeSubscription: Subscription;

    beforeEach(() => {
      marbles = [];
      values = {};
      const marbleized = marbleize(sut.accounts$);
      marbleizeSubscription = marbleized.subscription;
      marbles = marbleized.marbles;
      values = marbleized.values;
    });

    afterEach(() => {
      marbleizeSubscription.unsubscribe();
      marbles = [];
      values = {};
    });

    it("emits when account is added", () => {
      const a = SubjectData.loading([]);
      const b = SubjectData.loading([SubjectData.loading(lockedAccount)]);
      sut.upsertAccount(b.data[0].data);
      sut.upsertAccount(b.data[0].data);
      sut.upsertAccount(b.data[0].data);

      expect({ marbles: marbles, values: values }).toEqual({
        marbles: ["0", "1"],
        values: {
          0: a,
          1: b,
        },
      });
    });

    it("emits when an account is removed", () => {
      const a = SubjectData.loading([]);
      const b = SubjectData.loading([SubjectData.loading(lockedAccount)]);
      const c = SubjectData.loading([]);

      sut.upsertAccount(lockedAccount);
      sut.removeAccount(lockedAccount.id);

      expect({ marbles: marbles, values: values }).toEqual({
        marbles: ["0", "1", "2"],
        values: {
          0: a,
          1: b,
          2: c,
        },
      });
    });

    it("emits when account is changed", () => {
      const a = SubjectData.loading([]);
      const b = SubjectData.loading([SubjectData.loading(lockedAccount)]);
      const c = SubjectData.loading([SubjectData.loaded(lockedAccount)]);
      const d = SubjectData.loading([SubjectData.loaded(unlockedAccount)]);

      sut.upsertAccount(lockedAccount);
      sut.setAccountLoaded(lockedAccount.id, true);
      sut.upsertAccount(unlockedAccount);

      expect({ marbles: marbles, values: values }).toEqual({
        marbles: ["0", "1", "2", "3"],
        values: {
          0: a,
          1: b,
          2: c,
          3: d,
        },
      });
    });

    it("emits when accounts list is set to loaded", () => {
      const a = SubjectData.loading([]);
      const b = SubjectData.loaded([]);

      sut.setAccountsListLoaded(true);

      expect({ marbles: marbles, values: values }).toEqual({
        marbles: ["0", "1"],
        values: {
          0: a,
          1: b,
        },
      });
    });
  });

  describe("activeAccount$", () => {
    let marbles: string[];
    let values: { [key: string]: SubjectData<AccountData> };
    let marbleizeSubscription: Subscription;

    beforeEach(() => {
      marbles = [];
      values = {};
      const marbleized = marbleize(sut.activeAccount$);
      marbleizeSubscription = marbleized.subscription;
      marbles = marbleized.marbles;
      values = marbleized.values;

      sut.upsertAccount(lockedAccount);
    });

    afterEach(() => {
      marbleizeSubscription.unsubscribe();
      marbles = [];
      values = {};
    });

    describe("account list is still loading", () => {
      it("does not emit when active account is set", () => {
        sut.setActiveAccount("account");

        expect({ marbles: marbles, values: values }).toEqual({
          marbles: [],
          values: {},
        });
      });
    });

    describe("account list is loaded", () => {
      beforeEach(() => {
        sut.setAccountsListLoaded(true);
      });

      it("emits when active account is set", () => {
        const a = SubjectData.loading(lockedAccount);

        sut.setActiveAccount(lockedAccount.id);

        expect({ marbles: marbles, values: values }).toEqual({
          marbles: ["0", "1"],
          values: {
            0: undefined,
            1: a,
          },
        });
      });

      it("emits when active account is updated", () => {
        const a = SubjectData.loading(lockedAccount);
        const b = SubjectData.loading(unlockedAccount);

        sut.setActiveAccount(lockedAccount.id);
        sut.upsertAccount(unlockedAccount);
        sut.upsertAccount(unlockedAccount); // duplicate action is filtered

        expect({ marbles: marbles, values: values }).toEqual({
          marbles: ["0", "1", "2"],
          values: {
            0: undefined,
            1: a,
            2: b,
          },
        });
      });
    });
  });

  describe("activeAccountUnlocked$", () => {
    let marbles: string[];
    let values: { [key: string]: boolean };
    let marbleizeSubscription: Subscription;

    beforeEach(() => {
      marbles = [];
      values = {};
      const marbleized = marbleize(sut.activeAccountUnlocked$);
      marbleizeSubscription = marbleized.subscription;
      marbles = marbleized.marbles;
      values = marbleized.values;

      sut.upsertAccount(lockedAccount);
      sut.setAccountsListLoaded(true);
      sut.setActiveAccount(lockedAccount.id);
    });

    afterEach(() => {
      marbleizeSubscription.unsubscribe();
      marbles = [];
      values = {};
    });

    describe("active account not loaded", () => {
      it("does not emit when active account is set", () => {
        sut.setActiveAccount("account");

        expect({ marbles: marbles, values: values }).toEqual({
          marbles: [],
          values: {},
        });
      });
    });

    describe("active account is loaded", () => {
      beforeEach(() => {
        sut.setAccountLoaded(lockedAccount.id, true);
      });

      it("emits when active account is set", () => {
        const a = false;
        const b = true;

        sut.upsertAccount(unlockedAccount);

        expect({ marbles: marbles, values: values }).toEqual({
          marbles: ["0", "1"],
          values: {
            0: a,
            1: b,
          },
        });
      });
    });
  });

  describe("upsertAccount", () => {
    it("should do nothing if id is null", () => {
      const actual = marbleize(sut.accounts$);
      sut.upsertAccount(null);

      expect({ marbles: actual.marbles, values: actual.values }).toEqual({
        marbles: ["0"],
        values: { "0": SubjectData.loading([]) },
      });
    });
  });
});

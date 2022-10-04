import { mock } from "jest-mock-extended";

import { AccountService } from "../../abstractions/account/account.service";
import { LogService } from "../../abstractions/log.service";
import { MessagingService } from "../../abstractions/messaging.service";
import { AuthenticationStatus } from "../../enums/authenticationStatus";

import { AccountServiceImplementation } from "./account.service";

describe("AuthStateService", () => {
  const messagingService = mock<MessagingService>();
  const logService = mock<LogService>();

  let sut: AccountService;

  beforeEach(() => {
    sut = new AccountServiceImplementation(messagingService, logService);
  });

  afterEach(() => {
    jest.resetAllMocks();
    (sut as AccountServiceImplementation).complete();
  });

  describe("setAccountStatus", () => {
    it("should set the account status", () => {
      sut.accounts$.subscribe((accounts) => {
        expect(accounts.get("user1")).toEqual(AuthenticationStatus.Locked);
      });

      sut.setAccountStatus("user1", AuthenticationStatus.Locked);
    });

    it("should emit account locked", () => {
      sut.accountLocked$.subscribe((userId) => {
        expect(userId).toEqual("user1");
      });

      sut.setAccountStatus("user1", AuthenticationStatus.Locked);
    });

    it("should emit account logout", () => {
      sut.accountLogout$.subscribe((userId) => {
        expect(userId).toEqual("user1");
      });

      sut.setAccountStatus("user1", AuthenticationStatus.LoggedOut);
    });
  });

  describe("switchAccount", () => {
    beforeEach(() => {
      sut.setAccountStatus("user1", AuthenticationStatus.Unlocked);
    });

    it("should switch the active account", () => {
      sut.activeAccount$.subscribe((userId) => {
        expect(userId).toEqual("user1");
      });

      sut.switchAccount("user1");
    });

    it("should throw if account does not exist", () => {
      expect(() => sut.switchAccount("user2")).toThrow();
    });
  });

  describe("delete", () => {
    let implSut: AccountServiceImplementation;

    beforeEach(() => {
      implSut = sut as AccountServiceImplementation;
    });

    it("should send logout message", async () => {
      await implSut.delete();

      expect(messagingService.send).toHaveBeenCalledWith("logout");
    });
  });
});

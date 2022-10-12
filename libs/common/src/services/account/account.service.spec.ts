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
      const nextSpy = jest.fn();
      sut.accounts$.subscribe(nextSpy);

      sut.setAccountStatus("user1", AuthenticationStatus.Locked);
      expect(nextSpy).toHaveBeenCalledWith(new Map([["user1", AuthenticationStatus.Locked]]));
    });

    it("should emit account locked", () => {
      const nextSpy = jest.fn();
      sut.accountLocked$.subscribe(nextSpy);

      sut.setAccountStatus("user1", AuthenticationStatus.Locked);
      expect(nextSpy).toHaveBeenCalledWith("user1");
    });

    it("should emit account logout", () => {
      const nextSpy = jest.fn();
      sut.accountLogout$.subscribe(nextSpy);

      sut.setAccountStatus("user1", AuthenticationStatus.LoggedOut);
      expect(nextSpy).toHaveBeenCalledWith("user1");
    });

    it("should emit account unlock", () => {
      const nextSpy = jest.fn();
      sut.accountUnlocked$.subscribe(nextSpy);

      sut.setAccountStatus("user1", AuthenticationStatus.Unlocked);
      expect(nextSpy).toHaveBeenCalledWith("user1");
    });
  });

  describe("switchAccount", () => {
    beforeEach(() => {
      sut.setAccountStatus("user1", AuthenticationStatus.Unlocked);
    });

    it("should switch the active account", () => {
      const nextSpy = jest.fn();
      sut.activeAccount$.subscribe(nextSpy);

      sut.switchAccount("user1");
      expect(nextSpy).toHaveBeenCalledWith({ id: "user1", status: AuthenticationStatus.Unlocked });
    });

    it("should throw if account does not exist", () => {
      expect(() => sut.switchAccount("user2")).toThrow();
    });
  });

  describe("delete", () => {
    let implSut: AccountServiceImplementation;

    beforeEach(() => {
      implSut = sut as AccountServiceImplementation;
      sut.setAccountStatus("user1", AuthenticationStatus.Unlocked);
      sut.switchAccount("user1");
    });

    it("should send logout message", () => {
      implSut.delete();

      expect(messagingService.send).toHaveBeenCalledWith("logout");
    });

    it("should send logout event", () => {
      const nextSpy = jest.fn();
      sut.accountLogout$.subscribe(nextSpy);

      implSut.delete();

      expect(nextSpy).toHaveBeenCalledWith("user1");
    });
  });

  describe("active account status change", () => {
    beforeEach(() => {
      sut.setAccountStatus("user1", AuthenticationStatus.Unlocked);
      sut.setAccountStatus("user2", AuthenticationStatus.Locked);
      sut.switchAccount("user1");
    });

    it("should emit account locked", () => {
      const nextSpy = jest.fn();
      sut.activeAccountLocked$.subscribe(nextSpy);

      sut.setAccountStatus("user1", AuthenticationStatus.Locked);
      expect(nextSpy).toHaveBeenCalledWith("user1");
    });

    it("should not emit if different user is locked", () => {
      const nextSpy = jest.fn();
      sut.activeAccountLocked$.subscribe(nextSpy);

      sut.setAccountStatus("user2", AuthenticationStatus.Locked);
      expect(nextSpy).not.toHaveBeenCalled();
    });

    it("should emit account unlock", () => {
      const nextSpy = jest.fn();
      sut.activeAccountUnlocked$.subscribe(nextSpy);

      sut.setAccountStatus("user1", AuthenticationStatus.Unlocked);
      expect(nextSpy).toHaveBeenCalledWith("user1");
    });

    it("should not emit if different user is unlocked", () => {
      const nextSpy = jest.fn();
      sut.activeAccountUnlocked$.subscribe(nextSpy);

      sut.setAccountStatus("user2", AuthenticationStatus.Unlocked);
      expect(nextSpy).not.toHaveBeenCalled();
    });

    it("should emit account logout", () => {
      const nextSpy = jest.fn();
      sut.activeAccountLogout$.subscribe(nextSpy);

      sut.setAccountStatus("user1", AuthenticationStatus.LoggedOut);
      expect(nextSpy).toHaveBeenCalledWith("user1");
    });

    it("should not emit if different user is logged out", () => {
      const nextSpy = jest.fn();
      sut.activeAccountLogout$.subscribe(nextSpy);

      sut.setAccountStatus("user2", AuthenticationStatus.LoggedOut);
      expect(nextSpy).not.toHaveBeenCalled();
    });
  });
});

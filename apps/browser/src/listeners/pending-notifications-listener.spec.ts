import { mock, MockProxy } from "jest-mock-extended";

import LockedVaultPendingNotificationsItem from "../background/models/lockedVaultPendingNotificationsItem";
import { BrowserApi } from "../browser/browserApi";
import { BrowserStateService } from "../services/abstractions/browser-state.service";

import { PendingNotificationsListener } from "./pending-notifications-listener";

describe("PendingNotificationsListener", () => {
  let stateService: MockProxy<BrowserStateService>;

  let session: Record<string, unknown>;

  let sut: PendingNotificationsListener;

  beforeEach(() => {
    stateService = mock();

    session = {};

    stateService.getFromSessionMemory.mockImplementation((key: string) => {
      return Promise.resolve(session[key]);
    });

    stateService.setInSessionMemory.mockImplementation((key: string, value: unknown) => {
      session[key] = value;
      return Promise.resolve();
    });

    sut = new PendingNotificationsListener(stateService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("listen", () => {
    it("should call runUnlocked process a notification if there is one", async () => {
      const focusSpecifiedTabSpy = jest
        .spyOn(BrowserApi, "focusSpecifiedTab")
        .mockImplementation(() => Promise.resolve());

      const tabSendMessageDataSpy = jest
        .spyOn(BrowserApi, "tabSendMessageData")
        .mockImplementation(() => Promise.resolve());

      session = {
        lockedVaultPendingNotifications: [
          {
            commandToRetry: {
              sender: {
                tab: {
                  id: 1,
                },
              },
            },
          },
        ] as LockedVaultPendingNotificationsItem[],
      };

      await sut.listen({ command: "unlocked" }, null);

      // Should have popped that notification from the queue
      expect(session["lockedVaultPendingNotifications"]).toHaveLength(0);

      expect(focusSpecifiedTabSpy).toHaveBeenCalledTimes(1);
      expect(tabSendMessageDataSpy).toHaveBeenCalledTimes(1);
    });

    it("should not focus a tab if no tab.id is given", async () => {
      const focusSpecifiedTabSpy = jest
        .spyOn(BrowserApi, "focusSpecifiedTab")
        .mockImplementation(() => Promise.resolve());

      const tabSendMessageDataSpy = jest
        .spyOn(BrowserApi, "tabSendMessageData")
        .mockImplementation(() => Promise.resolve());

      session = {
        lockedVaultPendingNotifications: [
          {
            commandToRetry: {
              sender: {
                tab: {
                  id: null,
                },
              },
            },
          },
        ] as LockedVaultPendingNotificationsItem[],
      };

      await sut.listen({ command: "unlocked" }, null);

      // Should have popped that notification from the queue
      expect(session["lockedVaultPendingNotifications"]).toHaveLength(0);

      expect(focusSpecifiedTabSpy).toHaveBeenCalledTimes(0);
      expect(tabSendMessageDataSpy).toHaveBeenCalledTimes(1);
    });

    it("should not focus a tab if null tab is given", async () => {
      const focusSpecifiedTabSpy = jest
        .spyOn(BrowserApi, "focusSpecifiedTab")
        .mockImplementation(() => Promise.resolve());

      const tabSendMessageDataSpy = jest
        .spyOn(BrowserApi, "tabSendMessageData")
        .mockImplementation(() => Promise.resolve());

      session = {
        lockedVaultPendingNotifications: [
          {
            commandToRetry: {
              sender: {
                tab: null,
              },
            },
          },
        ] as LockedVaultPendingNotificationsItem[],
      };

      await sut.listen({ command: "unlocked" }, null);

      // Should have popped that notification from the queue
      expect(session["lockedVaultPendingNotifications"]).toHaveLength(0);

      expect(focusSpecifiedTabSpy).toHaveBeenCalledTimes(0);
      expect(tabSendMessageDataSpy).toHaveBeenCalledTimes(1);
    });

    it("should call pushNotification when message is addToLockedVaultPendingNotifications", async () => {
      await sut.listen(
        {
          command: "addToLockedVaultPendingNotifications",
          data: {
            commandToRetry: {
              sender: {},
              msg: {},
            },
            target: "thing",
          },
        },
        null
      );

      expect(session["lockedVaultPendingNotifications"]).toHaveLength(1);
      expect(
        (session["lockedVaultPendingNotifications"] as LockedVaultPendingNotificationsItem[])[0]
      ).toEqual({
        commandToRetry: {
          sender: {},
          msg: {},
        },
        target: "thing",
      });
    });
  });
});

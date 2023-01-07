import { CalledWithMock, matches, mock, MockProxy } from "jest-mock-extended";
import { BehaviorSubject, Observable } from "rxjs";

import { AuthService } from "@bitwarden/common/abstractions/auth.service";
import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { FolderService } from "@bitwarden/common/abstractions/folder/folder.service.abstraction";
import { PolicyService } from "@bitwarden/common/abstractions/policy/policy.service.abstraction";
import { AuthenticationStatus } from "@bitwarden/common/enums/authenticationStatus";
import { CipherType } from "@bitwarden/common/enums/cipherType";
import { PolicyType } from "@bitwarden/common/enums/policyType";
import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { FolderView } from "@bitwarden/common/models/view/folder.view";

import { BrowserApi } from "../browser/browserApi";
import { AutofillService } from "../services/abstractions/autofill.service";
import { BrowserStateService } from "../services/abstractions/browser-state.service";

import AddChangePasswordQueueMessage from "./models/addChangePasswordQueueMessage";
import AddLoginQueueMessage from "./models/addLoginQueueMessage";
import { NotificationQueueMessageType } from "./models/notificationQueueMessageType";
import NotificationBackground from "./notification.background";

describe("NotificationBackground", () => {
  let autofillService: MockProxy<AutofillService>;
  let cipherService: MockProxy<CipherService>;
  let authService: MockProxy<AuthService>;
  let policyService: MockProxy<PolicyService>;

  let folderViews: BehaviorSubject<FolderView[]>;

  let folderService: MockProxy<FolderService>;
  let stateService: MockProxy<BrowserStateService>;

  let tabSendMessageDataSpy: jest.SpyInstance<
    Promise<void>,
    [tab: chrome.tabs.Tab, command: string, data?: any]
  >;

  let sut: NotificationBackground;

  beforeEach(() => {
    autofillService = mock();
    cipherService = mock();
    authService = mock();
    policyService = mock();

    folderViews = new BehaviorSubject<FolderView[]>([]);

    folderService = mock();
    folderService.folderViews$ = folderViews;

    stateService = mock();

    tabSendMessageDataSpy = jest
      .spyOn(BrowserApi, "tabSendMessageData")
      .mockImplementation(() => Promise.resolve());

    sut = new NotificationBackground(
      autofillService,
      cipherService,
      authService,
      policyService,
      folderService,
      stateService
    );
  });

  afterEach(() => jest.resetAllMocks());

  const createTab = (id: number): chrome.tabs.Tab => {
    return {
      id,
      url: "https://www.example.com",
      index: 0,
      windowId: 0,
      active: true,
      autoDiscardable: true,
      pinned: false,
      highlighted: false,
      incognito: false,
      selected: true,
      discarded: false,
      groupId: 0,
    };
  };

  const mockQueue = (...items: (AddLoginQueueMessage | AddChangePasswordQueueMessage)[]) => {
    return stateService.getFromSessionMemory.mockImplementation((key) => {
      if (key === "notificationQueue") {
        return Promise.resolve(items);
      }
      return Promise.resolve(null);
    });
  };

  const mockObservable = <O extends Observable<T>, Y extends any[], T>(
    mock: CalledWithMock<O, Y>,
    valueGetter: (...args: Y) => T
  ) => {
    return mock.mockImplementation((...args: Y) => {
      return <O>new Observable<T>((subscriber) => {
        subscriber.next(valueGetter(...args));
      });
    });
  };

  describe("listen", () => {
    it("should proxy the message attached to unlockCompleted", async () => {
      mockQueue({
        type: NotificationQueueMessageType.AddLogin,
        tabId: 1,
        cipherId: "1",
        domain: "example.com",
      } as any);

      await sut.listen(
        {
          command: "unlockCompleted",
          data: {
            commandToRetry: {
              msg: {
                command: "bgNeverSave",
              },
              sender: {
                tab: createTab(1),
              },
            },
            target: "notification.background",
          },
        },
        {
          tab: createTab(1),
        }
      );

      expect(cipherService.saveNeverDomain).toBeCalledTimes(1);

      expect(cipherService.saveNeverDomain).toHaveBeenCalledWith("www.example.com");
    });

    it("should send a message to the responseCommand given", async () => {
      const senderTab = createTab(1);

      const revisionDate = new Date();

      folderViews.next([
        {
          id: "1",
          name: "Folder 1",
          revisionDate: revisionDate,
        },
      ]);

      await sut.listen(
        {
          command: "bgGetDataForTab",
          responseCommand: "notificationBarGetFoldersList",
        },
        {
          tab: senderTab,
        }
      );

      expect(tabSendMessageDataSpy).toBeCalledTimes(1);

      expect(tabSendMessageDataSpy).toHaveBeenCalledWith(
        senderTab,
        "notificationBarGetFoldersList",
        {
          folders: [
            {
              id: "1",
              name: "Folder 1",
              revisionDate: revisionDate,
            },
          ],
        }
      );
    });

    it("should send a closeNotificationBar message", async () => {
      const senderTab = createTab(1);
      await sut.listen(
        {
          command: "bgCloseNotificationBar",
        },
        {
          tab: senderTab,
        }
      );

      expect(tabSendMessageDataSpy).toBeCalledTimes(1);

      expect(tabSendMessageDataSpy).toHaveBeenCalledWith(senderTab, "closeNotificationBar");
    });

    it("should send a message to adjustNotificationBar", async () => {
      const senderTab = createTab(1);
      await sut.listen(
        {
          command: "bgAdjustNotificationBar",
          data: {
            height: 42,
          },
        },
        {
          tab: senderTab,
        }
      );

      expect(tabSendMessageDataSpy).toBeCalledTimes(1);

      expect(tabSendMessageDataSpy).toHaveBeenCalledWith(senderTab, "adjustNotificationBar", {
        height: 42,
      });
    });

    it("should not add a login if logged out", async () => {
      authService.getAuthStatus.mockResolvedValue(AuthenticationStatus.LoggedOut);

      await sut.listen(
        {
          command: "bgAddLogin",
          login: {
            username: "test-user",
            password: "test-password",
            url: "https://www.example.com",
          },
        },
        {
          tab: createTab(1),
        }
      );

      expect(stateService.setInSessionMemory).not.toHaveBeenCalled();
    });

    it("should add a login to the queue if locked", async () => {
      authService.getAuthStatus.mockResolvedValue(AuthenticationStatus.Locked);

      stateService.getDisableAddLoginNotification.mockResolvedValue(false);

      mockObservable(policyService.policyAppliesToActiveUser$, (policyType) => {
        return policyType !== PolicyType.PersonalOwnership;
      });

      await sut.listen(
        {
          command: "bgAddLogin",
          login: {
            username: "test-user",
            password: "test-password",
            url: "https://www.example.com",
          },
        },
        {
          tab: createTab(1),
        }
      );

      expect(stateService.setInSessionMemory).toHaveBeenCalledWith(
        "notificationQueue",
        matches<(AddLoginQueueMessage | AddChangePasswordQueueMessage)[]>((messages) => {
          expect(messages).toHaveLength(1);
          expect(messages[0].type).toBe(NotificationQueueMessageType.AddLogin);
          expect(messages[0].tabId).toBe(1);
          expect(messages[0].domain).toBe("example.com");
          return true;
        })
      );
    });

    it("should not add a login if their is an active personal ownership policy", async () => {
      authService.getAuthStatus.mockResolvedValue(AuthenticationStatus.Locked);

      stateService.getDisableAddLoginNotification.mockResolvedValue(false);

      mockObservable(policyService.policyAppliesToActiveUser$, (policyType) => {
        return policyType === PolicyType.PersonalOwnership;
      });

      await sut.listen(
        {
          command: "bgAddLogin",
          login: {
            username: "test-user",
            password: "test-password",
            url: "https://www.example.com",
          },
        },
        {
          tab: createTab(1),
        }
      );

      expect(stateService.setInSessionMemory).not.toHaveBeenCalled();
    });

    it("should add a login if logged in", async () => {
      authService.getAuthStatus.mockResolvedValue(AuthenticationStatus.Unlocked);

      stateService.getDisableAddLoginNotification.mockResolvedValue(false);

      mockObservable(policyService.policyAppliesToActiveUser$, () => false);

      cipherService.getAllDecryptedForUrl.mockResolvedValue([
        {
          login: {
            username: "different-user",
          },
        } as any,
      ]);

      await sut.listen(
        {
          command: "bgAddLogin",
          login: {
            username: "test-user",
            password: "test-password",
            url: "https://www.example.com",
          },
        },
        {
          tab: createTab(1),
        }
      );

      expect(stateService.setInSessionMemory).toHaveBeenCalledWith(
        "notificationQueue",
        matches<(AddLoginQueueMessage | AddChangePasswordQueueMessage)[]>((messages) => {
          expect(messages).toHaveLength(1);
          expect(messages[0].type).toBe(NotificationQueueMessageType.AddLogin);
          expect(messages[0].tabId).toBe(1);
          expect(messages[0].domain).toBe("example.com");
          return true;
        })
      );
    });

    it("should add a change password if logged in", async () => {
      authService.getAuthStatus.mockResolvedValue(AuthenticationStatus.Unlocked);

      mockObservable(policyService.policyAppliesToActiveUser$, () => false);

      cipherService.getAllDecryptedForUrl.mockResolvedValue([
        {
          id: "cipher-id",
          login: {
            username: "test-user",
            password: "different-password",
          },
        } as any,
      ]);

      stateService.getDisableChangedPasswordNotification.mockResolvedValue(false);

      await sut.listen(
        {
          command: "bgAddLogin",
          login: {
            username: "test-user",
            password: "test-password",
            url: "https://www.example.com",
          },
        },
        {
          tab: createTab(1),
        }
      );

      expect(stateService.setInSessionMemory).toHaveBeenCalledWith(
        "notificationQueue",
        matches<(AddLoginQueueMessage | AddChangePasswordQueueMessage)[]>((messages) => {
          expect(messages).toHaveLength(1);
          expect(messages[0].type).toBe(NotificationQueueMessageType.ChangePassword);
          expect((messages[0] as AddChangePasswordQueueMessage).cipherId).toBe("cipher-id");
          expect(messages[0].tabId).toBe(1);
          expect(messages[0].domain).toBe("example.com");
          return true;
        })
      );
    });

    it("should not show anything if there are multiple logins", async () => {
      authService.getAuthStatus.mockResolvedValue(AuthenticationStatus.Unlocked);

      mockObservable(policyService.policyAppliesToActiveUser$, () => false);

      cipherService.getAllDecryptedForUrl.mockResolvedValue([
        {
          id: "cipher-id",
          login: {
            username: "test-user",
            password: "different-password",
          },
        },
        {
          id: "cipher-id-2",
          login: {
            username: "test-user",
            password: "different-password-2",
          },
        },
      ] as any);

      stateService.getDisableChangedPasswordNotification.mockResolvedValue(false);

      await sut.listen(
        {
          command: "bgAddLogin",
          login: {
            username: "test-user",
            password: "test-password",
            url: "https://www.example.com",
          },
        },
        {
          tab: createTab(1),
        }
      );

      expect(stateService.setInSessionMemory).not.toHaveBeenCalled();
    });

    it("should add password change to queue when locked", async () => {
      authService.getAuthStatus.mockResolvedValue(AuthenticationStatus.Locked);

      await sut.listen(
        {
          command: "bgChangedPassword",
          data: {
            currentPassword: "old-password",
            newPassword: "new-password",
            url: "https://www.example.com",
          },
        },
        {
          tab: createTab(1),
        }
      );

      expect(stateService.setInSessionMemory).toHaveBeenCalledWith(
        "notificationQueue",
        matches<(AddLoginQueueMessage | AddChangePasswordQueueMessage)[]>((messages) => {
          expect(messages).toHaveLength(1);
          expect(messages[0].type).toBe(NotificationQueueMessageType.ChangePassword);
          expect((messages[0] as AddChangePasswordQueueMessage).cipherId).toBe(null);
          expect((messages[0] as AddChangePasswordQueueMessage).newPassword).toBe("new-password");
          expect(messages[0].tabId).toBe(1);
          expect(messages[0].domain).toBe("example.com");
          return true;
        })
      );
    });

    it("should update the right cipher when changing password", async () => {
      authService.getAuthStatus.mockResolvedValue(AuthenticationStatus.Unlocked);

      cipherService.getAllDecryptedForUrl.mockResolvedValue([
        {
          id: "cipher-id",
          login: {
            username: "test-user",
            password: "different-item",
          },
        },
        {
          id: "cipher-to-change",
          login: {
            username: "test-user",
            password: "old-password",
          },
        } as any,
      ]);

      await sut.listen(
        {
          command: "bgChangedPassword",
          data: {
            currentPassword: "old-password",
            newPassword: "new-password",
            url: "https://www.example.com",
          },
        },
        {
          tab: createTab(1),
        }
      );

      expect(stateService.setInSessionMemory).toHaveBeenCalledWith(
        "notificationQueue",
        matches<(AddLoginQueueMessage | AddChangePasswordQueueMessage)[]>((messages) => {
          expect(messages).toHaveLength(1);
          expect(messages[0].type).toBe(NotificationQueueMessageType.ChangePassword);
          expect((messages[0] as AddChangePasswordQueueMessage).cipherId).toBe("cipher-to-change");
          expect((messages[0] as AddChangePasswordQueueMessage).newPassword).toBe("new-password");
          expect(messages[0].tabId).toBe(1);
          expect(messages[0].domain).toBe("example.com");
          return true;
        })
      );
    });

    it("should default to first cipher if current password couldn't be found", async () => {
      authService.getAuthStatus.mockResolvedValue(AuthenticationStatus.Unlocked);

      cipherService.getAllDecryptedForUrl.mockResolvedValue([
        {
          id: "cipher-id",
          login: {
            username: "test-user",
            password: "different-item",
          },
        } as any,
      ]);

      await sut.listen(
        {
          command: "bgChangedPassword",
          data: {
            currentPassword: null,
            newPassword: "new-password",
            url: "https://www.example.com",
          },
        },
        {
          tab: createTab(1),
        }
      );

      expect(stateService.setInSessionMemory).toHaveBeenCalledWith(
        "notificationQueue",
        matches<(AddLoginQueueMessage | AddChangePasswordQueueMessage)[]>((messages) => {
          expect(messages).toHaveLength(1);
          expect(messages[0].type).toBe(NotificationQueueMessageType.ChangePassword);
          expect((messages[0] as AddChangePasswordQueueMessage).cipherId).toBe("cipher-id");
          expect((messages[0] as AddChangePasswordQueueMessage).newPassword).toBe("new-password");
          expect(messages[0].tabId).toBe(1);
          expect(messages[0].domain).toBe("example.com");
          return true;
        })
      );
    });

    it("should remove tab from the queue when bgAddClose or bgChangeClose are sent", async () => {
      for (const command of ["bgAddClose", "bgChangeClose"] as const) {
        stateService.getFromSessionMemory.mockImplementation((key) => {
          if (key === "notificationQueue") {
            return Promise.resolve([
              {
                type: NotificationQueueMessageType.AddLogin,
                tabId: 1,
                domain: "example.com",
              },
              {
                type: NotificationQueueMessageType.ChangePassword,
                tabId: 2,
                domain: "example.com",
              },
            ]);
          }
        });

        await sut.listen(
          {
            command: command,
          },
          {
            tab: createTab(1),
          }
        );

        expect(stateService.setInSessionMemory).toHaveBeenCalledWith(
          "notificationQueue",
          matches<(AddLoginQueueMessage | AddChangePasswordQueueMessage)[]>((messages) => {
            expect(messages).toHaveLength(1);
            expect(messages[0].type).toBe(NotificationQueueMessageType.ChangePassword);
            expect(messages[0].tabId).toBe(2);
            expect(messages[0].domain).toBe("example.com");
            return true;
          })
        );
      }
    });

    it("should prompt for login if locked or logged out when save message sent", async () => {
      for (const command of ["bgAddSave", "bgChangeSave"] as const) {
        for (const status of [
          AuthenticationStatus.Locked,
          AuthenticationStatus.LoggedOut,
        ] as const) {
          authService.getAuthStatus.mockResolvedValue(status);

          const tab = createTab(1);

          const message = {
            command: command,
            folder: "folder-id",
          } as const;

          const sender = {
            tab: tab,
          };

          await sut.listen(message, sender);

          expect(tabSendMessageDataSpy).toHaveBeenCalledTimes(2);

          expect(tabSendMessageDataSpy).toHaveBeenNthCalledWith(
            1,
            tab,
            "addToLockedVaultPendingNotifications",
            {
              commandToRetry: {
                msg: message,
                sender: sender,
              },
              target: "notification.background",
            }
          );

          expect(tabSendMessageDataSpy).toHaveBeenNthCalledWith(2, tab, "promptForLogin");

          tabSendMessageDataSpy.mockClear();
        }
      }
    });

    it("should should save the credentials when add save message is sent and unlocked", async () => {
      authService.getAuthStatus.mockResolvedValue(AuthenticationStatus.Unlocked);

      const now = new Date();

      mockQueue({
        cipherId: "cipher-id",
        domain: "example.com",
        expires: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours(),
          now.getMinutes() + 1
        ),
        newPassword: "new-password",
        tabId: 1,
        type: NotificationQueueMessageType.AddLogin,
        wasVaultLocked: false,
      });

      folderViews.next([
        {
          id: "folder-id",
          name: "folder-name",
          revisionDate: new Date(),
        },
      ]);

      const tab = createTab(1);

      await sut.listen(
        {
          command: "bgAddSave",
          folder: "folder-id",
        },
        {
          tab: tab,
        }
      );

      expect(tabSendMessageDataSpy).toHaveBeenNthCalledWith(1, tab, "closeNotificationBar");

      expect(cipherService.encrypt).toHaveBeenCalledTimes(1);
      expect(cipherService.createWithServer).toHaveBeenCalledTimes(1);
    });

    it("should should save the credentials when change save message is sent and unlocked", async () => {
      authService.getAuthStatus.mockResolvedValue(AuthenticationStatus.Unlocked);

      const now = new Date();

      mockQueue({
        cipherId: "cipher-id",
        domain: "example.com",
        expires: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours(),
          now.getMinutes() + 1
        ),
        newPassword: "new-password",
        tabId: 1,
        type: NotificationQueueMessageType.ChangePassword,
        wasVaultLocked: false,
      });

      const cipherMock = mock<Cipher>();
      cipherMock.id = "cipher-id";
      cipherMock.type = CipherType.Login;

      cipherService.get.mockResolvedValue(cipherMock);

      cipherMock.decrypt.mockResolvedValue({
        id: "cipher-id",
        type: CipherType.Login,
        login: {
          password: "old-password",
        },
      } as any);

      const tab = createTab(1);

      await sut.listen(
        {
          command: "bgChangeSave",
          folder: "folder-id",
        },
        {
          tab: tab,
        }
      );

      expect(tabSendMessageDataSpy).toHaveBeenNthCalledWith(1, tab, "closeNotificationBar");
      expect(cipherMock.decrypt).toHaveBeenCalledTimes(1);

      expect(cipherService.encrypt).toHaveBeenCalledTimes(1);
      expect(cipherService.encrypt).toHaveBeenCalledWith({
        id: "cipher-id",
        type: CipherType.Login,
        login: {
          password: "new-password",
        },
      });
    });

    // TODO: Add some tests for cleaning up the notification queue
  });
});

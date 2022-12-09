import { firstValueFrom } from "rxjs";

import { AuthService } from "@bitwarden/common/abstractions/auth.service";
import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { FolderService } from "@bitwarden/common/abstractions/folder/folder.service.abstraction";
import { PolicyService } from "@bitwarden/common/abstractions/policy/policy.service.abstraction";
import { SearchService } from "@bitwarden/common/abstractions/search.service";
import { AuthenticationStatus } from "@bitwarden/common/enums/authenticationStatus";
import { CipherType } from "@bitwarden/common/enums/cipherType";
import { PolicyType } from "@bitwarden/common/enums/policyType";
import { StateFactory } from "@bitwarden/common/factories/stateFactory";
import { Utils } from "@bitwarden/common/misc/utils";
import { GlobalState } from "@bitwarden/common/models/domain/global-state";
import { CipherView } from "@bitwarden/common/models/view/cipher.view";
import { LoginUriView } from "@bitwarden/common/models/view/login-uri.view";
import { LoginView } from "@bitwarden/common/models/view/login.view";

import { BrowserApi } from "../browser/browserApi";
import { Account } from "../models/account";
import { AutofillService } from "../services/abstractions/autofill.service";
import { BrowserStateService } from "../services/abstractions/browser-state.service";
import RuntimeMessage from "../types/runtime-messages";

import AddChangePasswordQueueMessage from "./models/addChangePasswordQueueMessage";
import AddLoginQueueMessage from "./models/addLoginQueueMessage";
import AddLoginRuntimeMessage from "./models/addLoginRuntimeMessage";
import ChangePasswordRuntimeMessage from "./models/changePasswordRuntimeMessage";
import LockedVaultPendingNotificationsItem from "./models/lockedVaultPendingNotificationsItem";
import { NotificationQueueMessageType } from "./models/notificationQueueMessageType";
import {
  authServiceFactory,
  AuthServiceInitOptions,
} from "./service_factories/auth-service.factory";
import {
  autofillServiceFactory,
  AutoFillServiceInitOptions,
} from "./service_factories/autofill-service.factory";
import { cipherServiceFactory } from "./service_factories/cipher-service.factory";
import { CachedServices } from "./service_factories/factory-options";
import { folderServiceFactory } from "./service_factories/folder-service.factory";
import { policyServiceFactory } from "./service_factories/policy-service.factory";
import { searchServiceFactory } from "./service_factories/search-service.factory";
import { stateServiceFactory } from "./service_factories/state-service.factory";

const notificationQueueKey = "notificationQueue";

export default class NotificationBackground {
  static async messageListener(
    services: CachedServices,
    message: RuntimeMessage,
    sender: chrome.runtime.MessageSender
  ) {
    const stateFactory = new StateFactory(GlobalState, Account);
    let searchService: SearchService | null = null;
    const serviceOptions: AutoFillServiceInitOptions & AuthServiceInitOptions = {
      apiServiceOptions: {
        logoutCallback: null,
      },
      cipherServiceOptions: {
        searchServiceFactory: () => searchService,
      },
      cryptoFunctionServiceOptions: {
        win: self,
      },
      encryptServiceOptions: {
        logMacFailures: false,
      },
      i18nServiceOptions: {
        systemLanguage: chrome.i18n.getUILanguage(),
      },
      keyConnectorServiceOptions: {
        logoutCallback: null,
      },
      logServiceOptions: {
        isDev: false,
      },
      platformUtilsServiceOptions: {
        biometricCallback: null,
        clipboardWriteCallback: null,
        win: self,
      },
      stateMigrationServiceOptions: {
        stateFactory: stateFactory,
      },
      stateServiceOptions: {
        stateFactory: stateFactory,
      },
    };

    searchService = await searchServiceFactory(services, serviceOptions);
    const autofillService = await autofillServiceFactory(services, serviceOptions);
    const cipherService = await cipherServiceFactory(services, serviceOptions);
    const authService = await authServiceFactory(services, serviceOptions);
    const policyService = await policyServiceFactory(services, serviceOptions);
    const folderService = await folderServiceFactory(services, serviceOptions);
    const stateService = await stateServiceFactory(services, serviceOptions);

    const notificationBar = new NotificationBackground(
      autofillService,
      cipherService,
      authService,
      policyService,
      folderService,
      stateService
    );
    await notificationBar.listen(message, sender);
  }

  constructor(
    private autofillService: AutofillService,
    private cipherService: CipherService,
    private authService: AuthService,
    private policyService: PolicyService,
    private folderService: FolderService,
    private stateService: BrowserStateService
  ) {}

  // Only needs to be ran for MV2
  async init() {
    if (chrome.runtime == null) {
      return;
    }

    BrowserApi.messageListener(
      "notification.background",
      async (msg: RuntimeMessage, sender: chrome.runtime.MessageSender) => {
        await this.listen(msg, sender);
      }
    );

    await this.cleanupNotificationQueue();
  }

  async listen(msg: RuntimeMessage, sender: chrome.runtime.MessageSender) {
    switch (msg.command) {
      case "unlockCompleted":
        if (msg.data.target !== "notification.background") {
          return;
        }
        await this.listen(msg.data.commandToRetry.msg, msg.data.commandToRetry.sender);
        break;
      case "bgGetDataForTab":
        await this.getDataForTab(sender.tab, msg.responseCommand);
        break;
      case "bgCloseNotificationBar":
        await BrowserApi.tabSendMessageData(sender.tab, "closeNotificationBar");
        break;
      case "bgAdjustNotificationBar":
        await BrowserApi.tabSendMessageData(sender.tab, "adjustNotificationBar", msg.data);
        break;
      case "bgAddLogin":
        await this.addLogin(msg.login, sender.tab);
        break;
      case "bgChangedPassword":
        await this.changedPassword(msg.data, sender.tab);
        break;
      case "bgAddClose":
      case "bgChangeClose":
        await this.removeTabFromNotificationQueue(sender.tab);
        break;
      case "bgAddSave":
      case "bgChangeSave":
        if ((await this.authService.getAuthStatus()) < AuthenticationStatus.Unlocked) {
          const retryMessage: LockedVaultPendingNotificationsItem = {
            commandToRetry: {
              msg: msg,
              sender: sender,
            },
            target: "notification.background",
          };
          await BrowserApi.tabSendMessageData(
            sender.tab,
            "addToLockedVaultPendingNotifications",
            retryMessage
          );
          await BrowserApi.tabSendMessageData(sender.tab, "promptForLogin");
          return;
        }
        await this.saveOrUpdateCredentials(sender.tab, msg.folder);
        break;
      case "bgNeverSave":
        await this.saveNever(sender.tab);
        break;
      case "collectPageDetailsResponse":
        switch (msg.sender) {
          case "notificationBar": {
            const forms = this.autofillService.getFormsWithPasswordFields(msg.details);
            await BrowserApi.tabSendMessageData(msg.tab, "notificationBarPageDetails", {
              details: msg.details,
              forms: forms,
            });
            break;
          }
          default:
            break;
        }
        break;
      default:
        break;
    }
  }

  async checkNotificationQueue(tab: chrome.tabs.Tab = null): Promise<void> {
    const notificationQueue = await this.getNotificationQueue();
    if (notificationQueue.length === 0) {
      return;
    }

    if (tab != null) {
      await this.doNotificationQueueCheck(tab);
      return;
    }

    const currentTab = await BrowserApi.getTabFromCurrentWindow();
    if (currentTab != null) {
      await this.doNotificationQueueCheck(currentTab);
    }
  }

  private async cleanupNotificationQueue() {
    const notificationQueue = await this.getNotificationQueue();
    for (let i = notificationQueue.length - 1; i >= 0; i--) {
      if (notificationQueue[i].expires < new Date()) {
        await this.spliceNotificationQueue(i);
      }
    }
    // TODO: Convert to using scheduled tasks from alarms
    setTimeout(() => this.cleanupNotificationQueue(), 2 * 60 * 1000); // check every 2 minutes
  }

  private async doNotificationQueueCheck(tab: chrome.tabs.Tab): Promise<void> {
    if (tab == null) {
      return;
    }

    const tabDomain = Utils.getDomain(tab.url);
    if (tabDomain == null) {
      return;
    }

    const notificationQueue = await this.getNotificationQueue();
    for (let i = 0; i < notificationQueue.length; i++) {
      if (notificationQueue[i].tabId !== tab.id || notificationQueue[i].domain !== tabDomain) {
        continue;
      }

      if (notificationQueue[i].type === NotificationQueueMessageType.AddLogin) {
        BrowserApi.tabSendMessageData(tab, "openNotificationBar", {
          type: "add",
          typeData: {
            isVaultLocked: notificationQueue[i].wasVaultLocked,
            theme: await this.getCurrentTheme(),
          },
        });
      } else if (notificationQueue[i].type === NotificationQueueMessageType.ChangePassword) {
        BrowserApi.tabSendMessageData(tab, "openNotificationBar", {
          type: "change",
          typeData: {
            isVaultLocked: notificationQueue[i].wasVaultLocked,
            theme: await this.getCurrentTheme(),
          },
        });
      }
      break;
    }
  }

  private async getCurrentTheme() {
    return await this.stateService.getTheme();
  }

  private async removeTabFromNotificationQueue(tab: chrome.tabs.Tab) {
    const notificationQueue = await this.getNotificationQueue();
    for (let i = notificationQueue.length - 1; i >= 0; i--) {
      if (notificationQueue[i].tabId === tab.id) {
        await this.spliceNotificationQueue(i);
      }
    }
  }

  private async addLogin(loginInfo: AddLoginRuntimeMessage, tab: chrome.tabs.Tab) {
    const authStatus = await this.authService.getAuthStatus();
    if (authStatus === AuthenticationStatus.LoggedOut) {
      return;
    }

    const loginDomain = Utils.getDomain(loginInfo.url);
    if (loginDomain == null) {
      return;
    }

    const normalizedUsername = loginInfo.username?.toLowerCase();

    const disabledAddLogin = await this.stateService.getDisableAddLoginNotification();
    if (authStatus === AuthenticationStatus.Locked) {
      if (disabledAddLogin) {
        return;
      }

      if (!(await this.allowPersonalOwnership())) {
        return;
      }

      await this.pushAddLoginToQueue(loginDomain, loginInfo, tab, true);
      return;
    }

    const ciphers = await this.cipherService.getAllDecryptedForUrl(loginInfo.url);
    const usernameMatches = ciphers.filter(
      (c) => c.login.username != null && c.login.username.toLowerCase() === normalizedUsername
    );
    if (usernameMatches.length === 0) {
      if (disabledAddLogin) {
        return;
      }

      if (!(await this.allowPersonalOwnership())) {
        return;
      }

      await this.pushAddLoginToQueue(loginDomain, loginInfo, tab);
    } else if (
      usernameMatches.length === 1 &&
      usernameMatches[0].login.password !== loginInfo.password
    ) {
      const disabledChangePassword =
        await this.stateService.getDisableChangedPasswordNotification();
      if (disabledChangePassword) {
        return;
      }
      await this.pushChangePasswordToQueue(
        usernameMatches[0].id,
        loginDomain,
        loginInfo.password,
        tab
      );
    }
  }

  private async pushAddLoginToQueue(
    loginDomain: string,
    loginInfo: AddLoginRuntimeMessage,
    tab: chrome.tabs.Tab,
    isVaultLocked = false
  ) {
    // remove any old messages for this tab
    await this.removeTabFromNotificationQueue(tab);
    const message: AddLoginQueueMessage = {
      type: NotificationQueueMessageType.AddLogin,
      username: loginInfo.username,
      password: loginInfo.password,
      domain: loginDomain,
      uri: loginInfo.url,
      tabId: tab.id,
      expires: new Date(new Date().getTime() + 5 * 60000), // 5 minutes
      wasVaultLocked: isVaultLocked,
    };
    await this.pushNotificationQueue(message);
    await this.checkNotificationQueue(tab);
  }

  private async changedPassword(changeData: ChangePasswordRuntimeMessage, tab: chrome.tabs.Tab) {
    const loginDomain = Utils.getDomain(changeData.url);
    if (loginDomain == null) {
      return;
    }

    if ((await this.authService.getAuthStatus()) < AuthenticationStatus.Unlocked) {
      await this.pushChangePasswordToQueue(null, loginDomain, changeData.newPassword, tab, true);
      return;
    }

    let id: string = null;
    const ciphers = await this.cipherService.getAllDecryptedForUrl(changeData.url);
    if (changeData.currentPassword != null) {
      const passwordMatches = ciphers.filter(
        (c) => c.login.password === changeData.currentPassword
      );
      if (passwordMatches.length === 1) {
        id = passwordMatches[0].id;
      }
    } else if (ciphers.length === 1) {
      id = ciphers[0].id;
    }
    if (id != null) {
      await this.pushChangePasswordToQueue(id, loginDomain, changeData.newPassword, tab);
    }
  }

  private async pushChangePasswordToQueue(
    cipherId: string,
    loginDomain: string,
    newPassword: string,
    tab: chrome.tabs.Tab,
    isVaultLocked = false
  ) {
    // remove any old messages for this tab
    await this.removeTabFromNotificationQueue(tab);
    const message: AddChangePasswordQueueMessage = {
      type: NotificationQueueMessageType.ChangePassword,
      cipherId: cipherId,
      newPassword: newPassword,
      domain: loginDomain,
      tabId: tab.id,
      expires: new Date(new Date().getTime() + 5 * 60000), // 5 minutes
      wasVaultLocked: isVaultLocked,
    };
    await this.pushNotificationQueue(message);
    await this.checkNotificationQueue(tab);
  }

  private async saveOrUpdateCredentials(tab: chrome.tabs.Tab, folderId?: string) {
    const notificationQueue = await this.getNotificationQueue();
    for (let i = notificationQueue.length - 1; i >= 0; i--) {
      const queueMessage = notificationQueue[i];
      if (
        queueMessage.tabId !== tab.id ||
        (queueMessage.type !== NotificationQueueMessageType.AddLogin &&
          queueMessage.type !== NotificationQueueMessageType.ChangePassword)
      ) {
        continue;
      }

      const tabDomain = Utils.getDomain(tab.url);
      if (tabDomain != null && tabDomain !== queueMessage.domain) {
        continue;
      }

      await this.spliceNotificationQueue(i);
      BrowserApi.tabSendMessageData(tab, "closeNotificationBar");

      if (queueMessage.type === NotificationQueueMessageType.ChangePassword) {
        const changePasswordMessage = queueMessage as AddChangePasswordQueueMessage;
        const cipher = await this.getDecryptedCipherById(changePasswordMessage.cipherId);
        if (cipher == null) {
          return;
        }
        await this.updateCipher(cipher, changePasswordMessage.newPassword);
        return;
      }

      if (queueMessage.type === NotificationQueueMessageType.AddLogin) {
        if (!queueMessage.wasVaultLocked) {
          await this.createNewCipher(queueMessage as AddLoginQueueMessage, folderId);
          BrowserApi.tabSendMessageData(tab, "addedCipher");
          return;
        }

        // If the vault was locked, check if a cipher needs updating instead of creating a new one
        const addLoginMessage = queueMessage as AddLoginQueueMessage;
        const ciphers = await this.cipherService.getAllDecryptedForUrl(addLoginMessage.uri);
        const usernameMatches = ciphers.filter(
          (c) =>
            c.login.username != null && c.login.username.toLowerCase() === addLoginMessage.username
        );

        if (usernameMatches.length >= 1) {
          await this.updateCipher(usernameMatches[0], addLoginMessage.password);
          return;
        }

        await this.createNewCipher(addLoginMessage, folderId);
        BrowserApi.tabSendMessageData(tab, "addedCipher");
      }
    }
  }

  private async createNewCipher(queueMessage: AddLoginQueueMessage, folderId: string) {
    const loginModel = new LoginView();
    const loginUri = new LoginUriView();
    loginUri.uri = queueMessage.uri;
    loginModel.uris = [loginUri];
    loginModel.username = queueMessage.username;
    loginModel.password = queueMessage.password;
    const model = new CipherView();
    model.name = Utils.getHostname(queueMessage.uri) || queueMessage.domain;
    model.name = model.name.replace(/^www\./, "");
    model.type = CipherType.Login;
    model.login = loginModel;

    if (!Utils.isNullOrWhitespace(folderId)) {
      const folders = await firstValueFrom(this.folderService.folderViews$);
      if (folders.some((x) => x.id === folderId)) {
        model.folderId = folderId;
      }
    }

    const cipher = await this.cipherService.encrypt(model);
    await this.cipherService.createWithServer(cipher);
  }

  private async getDecryptedCipherById(cipherId: string) {
    const cipher = await this.cipherService.get(cipherId);
    if (cipher != null && cipher.type === CipherType.Login) {
      return await cipher.decrypt();
    }
    return null;
  }

  private async updateCipher(cipher: CipherView, newPassword: string) {
    if (cipher != null && cipher.type === CipherType.Login) {
      cipher.login.password = newPassword;
      const newCipher = await this.cipherService.encrypt(cipher);
      await this.cipherService.updateWithServer(newCipher);
    }
  }

  private async saveNever(tab: chrome.tabs.Tab) {
    const notificationQueue = await this.getNotificationQueue();
    for (let i = notificationQueue.length - 1; i >= 0; i--) {
      const queueMessage = notificationQueue[i];
      if (
        queueMessage.tabId !== tab.id ||
        queueMessage.type !== NotificationQueueMessageType.AddLogin
      ) {
        continue;
      }

      const tabDomain = Utils.getDomain(tab.url);
      if (tabDomain != null && tabDomain !== queueMessage.domain) {
        continue;
      }

      await this.spliceNotificationQueue(i);
      BrowserApi.tabSendMessageData(tab, "closeNotificationBar");

      const hostname = Utils.getHostname(tab.url);
      await this.cipherService.saveNeverDomain(hostname);
    }
  }

  private async getDataForTab(tab: chrome.tabs.Tab, responseCommand: string) {
    const responseData: Record<string, unknown> = {};
    if (responseCommand === "notificationBarGetFoldersList") {
      responseData.folders = await firstValueFrom(this.folderService.folderViews$);
    }

    await BrowserApi.tabSendMessageData(tab, responseCommand, responseData);
  }

  private async allowPersonalOwnership(): Promise<boolean> {
    return !(await firstValueFrom(
      this.policyService.policyAppliesToActiveUser$(PolicyType.PersonalOwnership)
    ));
  }

  private async getNotificationQueue(): Promise<
    (AddLoginQueueMessage | AddChangePasswordQueueMessage)[]
  > {
    const queue = await this.stateService.getFromSessionMemory<
      (AddLoginQueueMessage | AddChangePasswordQueueMessage)[]
    >(notificationQueueKey);
    return queue ?? [];
  }

  private async pushNotificationQueue(
    message: AddLoginQueueMessage | AddChangePasswordQueueMessage
  ) {
    const queue = await this.getNotificationQueue();
    queue.push(message);
    await this.stateService.setInSessionMemory(notificationQueueKey, queue);
  }

  private async spliceNotificationQueue(index: number) {
    const queue = await this.getNotificationQueue();
    queue.splice(index, 1);
    await this.stateService.setInSessionMemory(notificationQueueKey, queue);
  }
}

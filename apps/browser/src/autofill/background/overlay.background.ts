import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";

import LockedVaultPendingNotificationsItem from "../../background/models/lockedVaultPendingNotificationsItem";
import { BrowserApi } from "../../platform/browser/browser-api";
import AutofillOverlayPort from "../overlay/utils/port-identifiers.enum";
import { AutofillService } from "../services/abstractions/autofill.service";

import {
  OverlayBackgroundExtensionMessageHandlers,
  OverlayIconPortMessageHandlers,
  OverlayListPortMessageHandlers,
} from "./abstractions/overlay.background";

class OverlayBackground {
  private ciphers: any[] = [];
  private currentContextualCiphers: any[] = [];
  private pageDetailsToAutoFill: any[] = [];
  private overlayListSenderInfo: chrome.runtime.MessageSender;
  private userAuthStatus: AuthenticationStatus = AuthenticationStatus.LoggedOut;
  private overlayIconPort: chrome.runtime.Port;
  private overlayListPort: chrome.runtime.Port;
  private readonly extensionMessageHandlers: OverlayBackgroundExtensionMessageHandlers = {
    bgOpenAutofillOverlayList: () => this.openAutofillOverlayList(),
    bgAutofillOverlayListItem: ({ message, sender }) =>
      this.autofillOverlayListItem(message, sender),
    bgCheckOverlayFocused: () => this.checkOverlayFocused(),
    bgOverlayUnlockVault: ({ sender }) => this.unlockVault(sender),
    bgCheckAuthStatus: async () => await this.getAuthStatus(),
    bgAutofillOverlayIconClosed: () => this.overlayIconClosed(),
    bgAutofillOverlayListClosed: () => this.overlayListClosed(),
    collectPageDetailsResponse: ({ message, sender }) =>
      this.collectPageDetailsResponse(message, sender),
    unlockCompleted: () => this.openAutofillOverlayList(),
  };
  private readonly overlayIconPortMessageHandlers: OverlayIconPortMessageHandlers = {
    overlayIconClicked: () => this.openAutofillOverlayList(),
    closeAutofillOverlay: () => this.closeAutofillOverlay(),
    overlayIconBlurred: () => this.checkOverlayListFocused(),
  };
  private readonly overlayListPortMessageHandlers: OverlayListPortMessageHandlers = {
    closeAutofillOverlay: () => this.closeAutofillOverlay(),
    overlayListBlurred: () => this.checkOverlayIconFocused(),
  };

  constructor(
    private cipherService: CipherService,
    private autofillService: AutofillService,
    private authService: AuthService
  ) {
    this.getAuthStatus();
    this.setupExtensionMessageListeners();
  }

  private collectPageDetailsResponse(message: any, sender: chrome.runtime.MessageSender) {
    const currentTab = this.pageDetailsToAutoFill[0]?.tab;
    if (!currentTab || currentTab.id !== sender.tab.id) {
      this.pageDetailsToAutoFill = [];
    }

    this.pageDetailsToAutoFill.push({
      frameId: sender.frameId,
      tab: sender.tab,
      details: message.details,
    });
  }

  private autofillOverlayListItem(message: any, sender: chrome.runtime.MessageSender) {
    if (!message.cipherId) {
      return;
    }
    const cipher = this.ciphers.find((c) => c.id === message.cipherId);

    this.autofillService.doAutoFill({
      tab: sender.tab,
      cipher: cipher,
      pageDetails: this.pageDetailsToAutoFill,
      fillNewPassword: true,
      allowTotpAutofill: true,
    });
  }

  private checkOverlayFocused() {
    if (this.overlayListPort) {
      this.checkOverlayListFocused();

      return;
    }

    this.checkOverlayIconFocused();
  }

  private checkOverlayIconFocused() {
    if (!this.overlayIconPort) {
      return;
    }

    this.overlayIconPort.postMessage({ command: "checkOverlayIconFocused" });
  }

  private checkOverlayListFocused() {
    if (!this.overlayListPort) {
      return;
    }

    this.overlayListPort.postMessage({ command: "checkOverlayListFocused" });
  }

  private closeAutofillOverlay() {
    if (!this.overlayListSenderInfo) {
      return;
    }

    chrome.tabs.sendMessage(this.overlayListSenderInfo.tab.id, { command: "closeAutofillOverlay" });
  }

  private overlayIconClosed() {
    this.overlayIconPort = null;
  }

  private overlayListClosed() {
    this.overlayListPort = null;
  }

  private async openAutofillOverlayList() {
    // TODO: Likely this won't work effectively, we need to consider how to handle iframed forms
    const currentTab = await BrowserApi.getTabFromCurrentWindowId();
    const authStatus = await this.getAuthStatus();
    chrome.tabs.sendMessage(currentTab.id, {
      command: "openAutofillOverlayList",
      authStatus: authStatus,
    });
  }

  async updateCurrentContextualCiphers() {
    if (this.userAuthStatus !== AuthenticationStatus.Unlocked) {
      return;
    }

    // TODO: Likely this won't work effectively, we need to consider how to handle iframed forms
    const currentTab = await BrowserApi.getTabFromCurrentWindowId();
    this.ciphers = await this.cipherService.getAllDecryptedForUrl(currentTab.url);

    this.currentContextualCiphers = this.ciphers.map((cipher) => ({
      id: cipher.id,
      name: cipher.name,
      type: cipher.type,
      reprompt: cipher.reprompt,
      favorite: cipher.favorite,
      login: {
        username: cipher.login.username,
      },
      card: {
        cardholderName: cipher.card.cardholderName,
        partialNumber: cipher.card.number?.slice(-4),
        expMonth: cipher.card.expMonth,
        expYear: cipher.card.expYear,
      },
      identity: {
        title: cipher.identity.title,
        firstName: cipher.identity.firstName,
        middleName: cipher.identity.middleName,
        lastName: cipher.identity.lastName,
        email: cipher.identity.email,
        company: cipher.identity.company,
      },
    }));
  }

  private async getAuthStatus() {
    const authStatus = await this.authService.getAuthStatus();
    if (authStatus !== this.userAuthStatus && authStatus === AuthenticationStatus.Unlocked) {
      this.userAuthStatus = authStatus;
      await this.updateCurrentContextualCiphers();
    }

    this.userAuthStatus = authStatus;
    return this.userAuthStatus;
  }

  private async unlockVault(sender: chrome.runtime.MessageSender) {
    this.closeAutofillOverlay();
    const retryMessage: LockedVaultPendingNotificationsItem = {
      commandToRetry: {
        msg: "bgOpenAutofillOverlayList",
        sender: sender,
      },
      target: "overlay.background",
    };
    await BrowserApi.tabSendMessageData(
      sender.tab,
      "addToLockedVaultPendingNotifications",
      retryMessage
    );
    await BrowserApi.tabSendMessageData(sender.tab, "promptForLogin");
  }

  private setupExtensionMessageListeners() {
    chrome.runtime.onMessage.addListener(this.handleExtensionMessage);
    chrome.runtime.onConnect.addListener(this.handlePortOnConnect);
  }

  private handleExtensionMessage = (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    const command: string = message.command;
    const handler: CallableFunction | undefined = this.extensionMessageHandlers[command];
    if (!handler) {
      return false;
    }

    const messageResponse = handler({ message, sender });
    if (!messageResponse) {
      return false;
    }

    Promise.resolve(messageResponse).then((response) => sendResponse(response));
    return true;
  };

  private handlePortOnConnect = (port: chrome.runtime.Port) => {
    if (port.name === AutofillOverlayPort.Icon) {
      this.setupOverlayIconPort(port);
    }

    if (port.name === AutofillOverlayPort.List) {
      this.setupOverlayListPort(port);
    }
  };

  private setupOverlayIconPort = async (port: chrome.runtime.Port) => {
    this.overlayIconPort = port;
    this.overlayIconPort.postMessage({
      command: "initAutofillOverlayIcon",
      authStatus: this.userAuthStatus || (await this.getAuthStatus()),
      styleSheetUrl: chrome.runtime.getURL("overlay/icon.css"),
    });
    this.overlayIconPort.onMessage.addListener(this.handleOverlayIconPortMessage);
  };

  private handleOverlayIconPortMessage = (message: any, port: chrome.runtime.Port) => {
    if (port.name !== AutofillOverlayPort.Icon) {
      return;
    }

    const handler = this.overlayIconPortMessageHandlers[message?.command];
    if (!handler) {
      return;
    }

    handler({ message, port });
  };

  private setupOverlayListPort = async (port: chrome.runtime.Port) => {
    if (port.sender) {
      this.overlayListSenderInfo = port.sender;
    }

    this.overlayListPort = port;
    this.overlayListPort.postMessage({
      command: "initAutofillOverlayList",
      authStatus: this.userAuthStatus || (await this.getAuthStatus()),
      ciphers: this.currentContextualCiphers,
      styleSheetUrl: chrome.runtime.getURL("overlay/list.css"),
    });
    this.overlayListPort.onMessage.addListener(this.handleOverlayListPortMessage);
  };

  private handleOverlayListPortMessage = (message: any, port: chrome.runtime.Port) => {
    if (port.name !== AutofillOverlayPort.List) {
      return;
    }

    const handler = this.overlayListPortMessageHandlers[message?.command];
    if (!handler) {
      return;
    }

    handler({ message, port });
  };
}

export default OverlayBackground;

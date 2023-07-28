import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";

import LockedVaultPendingNotificationsItem from "../../background/models/lockedVaultPendingNotificationsItem";
import { BrowserApi } from "../../platform/browser/browser-api";
import { AutofillService } from "../services/abstractions/autofill.service";

import { OverlayBackgroundExtensionMessageHandlers } from "./abstractions/overlay.background";

class OverlayBackground {
  private ciphers: any[] = [];
  private currentContextualCiphers: any[] = [];
  private pageDetailsToAutoFill: any;
  private overlayListSenderInfo: chrome.runtime.MessageSender;
  private userAuthStatus: AuthenticationStatus;
  private readonly extensionMessageHandlers: OverlayBackgroundExtensionMessageHandlers = {
    bgUpdateAutofillOverlayListSender: ({ sender }) => this.updateAutofillOverlayListSender(sender),
    bgOpenAutofillOverlayList: () => this.openAutofillOverlayList(),
    bgGetAutofillOverlayList: ({ sender }) => this.getAutofillOverlayList(sender),
    bgAutofillOverlayListItem: ({ message, sender }) =>
      this.autofillOverlayListItem(message, sender),
    bgCheckOverlayFocused: () => this.checkOverlayFocused(),
    bgCloseOverlay: () => this.removeOverlay(),
    bgOverlayUnlockVault: ({ sender }) => this.unlockVault(sender),
    collectPageDetailsResponse: ({ message }) => this.collectPageDetailsResponse(message),
    unlockCompleted: () => this.openAutofillOverlayList(),
  };

  constructor(
    private cipherService: CipherService,
    private autofillService: AutofillService,
    private authService: AuthService
  ) {
    this.getAuthStatus();
    this.setupExtensionMessageListeners();
  }

  private collectPageDetailsResponse(message: any) {
    this.pageDetailsToAutoFill = message.details;
  }

  private autofillOverlayListItem(message: any, sender: chrome.runtime.MessageSender) {
    if (!message.cipherId) {
      return;
    }
    const cipher = this.ciphers.find((c) => c.id === message.cipherId);

    this.autofillService.doAutoFill({
      tab: sender.tab,
      cipher: cipher,
      pageDetails: [
        {
          frameId: 0, // sender.frameId,
          tab: sender.tab,
          details: this.pageDetailsToAutoFill,
        },
      ],
      fillNewPassword: true,
      allowTotpAutofill: true,
    });
  }
  private updateAutofillOverlayListSender(sender: chrome.runtime.MessageSender) {
    this.overlayListSenderInfo = sender;
  }

  private getAutofillOverlayList(sender: chrome.runtime.MessageSender) {
    if (!this.overlayListSenderInfo) {
      return;
    }

    chrome.tabs.sendMessage(
      this.overlayListSenderInfo.tab.id,
      {
        command: "updateAutofillOverlayList",
        ciphers: this.currentContextualCiphers,
      },
      {
        frameId: this.overlayListSenderInfo.frameId,
      }
    );
  }

  private checkOverlayFocused() {
    if (!this.overlayListSenderInfo) {
      return false;
    }

    return new Promise((resolve) => {
      chrome.tabs.sendMessage(
        this.overlayListSenderInfo.tab.id,
        {
          command: "checkOverlayFocused",
        },
        {
          frameId: this.overlayListSenderInfo.frameId,
        },
        (response) => resolve(response)
      );
    });
  }

  private removeOverlay() {
    if (!this.overlayListSenderInfo) {
      return;
    }

    chrome.tabs.sendMessage(this.overlayListSenderInfo.tab.id, {
      command: "removeAutofillOverlay",
    });
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

    return authStatus;
  }

  private async unlockVault(sender: chrome.runtime.MessageSender) {
    this.removeOverlay();
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
}

export default OverlayBackground;

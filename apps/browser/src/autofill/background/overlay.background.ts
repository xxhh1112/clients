import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";

import { BrowserApi } from "../../platform/browser/browser-api";
import { AutofillService } from "../services/abstractions/autofill.service";

class OverlayBackground {
  private ciphers: any[] = [];
  private currentContextualCiphers: any[] = [];
  private pageDetailsToAutoFill: any;
  private overlaySenderInfo: chrome.runtime.MessageSender;
  private readonly extensionMessageHandlers: Record<string, any> = {
    bgOpenAutofillOverlayList: () => this.openAutofillOverlayList(),
    bgGetAutofillOverlayList: ({ sender }: { sender: chrome.runtime.MessageSender }) =>
      this.getAutofillOverlayList(sender),
    bgAutofillOverlayListItem: ({
      message,
      sender,
    }: {
      message: any;
      sender: chrome.runtime.MessageSender;
    }) => this.autofillOverlayListItem(message, sender),
    collectPageDetailsResponse: ({ message }: { message: any }) =>
      this.collectPageDetailsResponse(message),
    bgCheckOverlayFocused: () => this.checkOverlayFocused(),
    bgCloseOverlay: () => this.removeOverlay(),
  };

  constructor(
    private cipherService: CipherService,
    private autofillService: AutofillService,
    private authService: AuthService
  ) {
    this.updateCurrentContextualCiphers();
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

  private getAutofillOverlayList(sender: chrome.runtime.MessageSender) {
    this.overlaySenderInfo = sender;
    chrome.tabs.sendMessage(
      this.overlaySenderInfo.tab.id,
      {
        command: "updateAutofillOverlayList",
        ciphers: this.currentContextualCiphers,
      },
      {
        frameId: this.overlaySenderInfo.frameId,
      }
    );
  }

  private checkOverlayFocused() {
    chrome.tabs.sendMessage(
      this.overlaySenderInfo.tab.id,
      {
        command: "checkOverlayFocused",
      },
      {
        frameId: this.overlaySenderInfo.frameId,
      }
    );
  }

  private removeOverlay() {
    chrome.tabs.sendMessage(this.overlaySenderInfo.tab.id, {
      command: "removeOverlay",
    });
  }

  private async openAutofillOverlayList() {
    // TODO: Likely this won't work effectively, we need to consider how to handle iframed forms
    const currentTab = await BrowserApi.getTabFromCurrentWindowId();
    chrome.tabs.sendMessage(currentTab.id, {
      command: "openAutofillOverlayList",
      authStatus: await this.authService.getAuthStatus(),
    });
  }

  async updateCurrentContextualCiphers() {
    if ((await this.authService.getAuthStatus()) !== AuthenticationStatus.Unlocked) {
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

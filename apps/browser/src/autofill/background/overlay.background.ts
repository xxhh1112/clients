import { SettingsService } from "@bitwarden/common/abstractions/settings.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import {
  WebsiteIconData,
  WebsiteIconService,
} from "@bitwarden/common/services/website-icon.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { LoginUriView } from "@bitwarden/common/vault/models/view/login-uri.view";
import { LoginView } from "@bitwarden/common/vault/models/view/login.view";

import LockedVaultPendingNotificationsItem from "../../background/models/lockedVaultPendingNotificationsItem";
import { BrowserApi } from "../../platform/browser/browser-api";
import { AutofillService, PageDetail } from "../services/abstractions/autofill.service";
import { AutofillOverlayElement, AutofillOverlayPort } from "../utils/autofill-overlay.enum";

import {
  FocusedFieldData,
  OverlayBackgroundExtensionMessageHandlers,
  OverlayButtonPortMessageHandlers,
  OverlayCipherData,
  OverlayListPortMessageHandlers,
  OverlayBackground as OverlayBackgroundInterface,
  OverlayBackgroundExtensionMessage,
  OverlayAddNewItemMessage,
} from "./abstractions/overlay.background";

class OverlayBackground implements OverlayBackgroundInterface {
  private overlayCiphers: Map<string, CipherView> = new Map();
  private pageDetailsForTab: Record<number, PageDetail[]> = {};
  private userAuthStatus: AuthenticationStatus = AuthenticationStatus.LoggedOut;
  private overlayButtonPort: chrome.runtime.Port;
  private overlayListPort: chrome.runtime.Port;
  private focusedFieldData: FocusedFieldData;
  private overlayPageTranslations: Record<string, string>;
  private readonly iconsServerUrl: string;
  private readonly extensionMessageHandlers: OverlayBackgroundExtensionMessageHandlers = {
    openAutofillOverlay: () => this.openOverlay(),
    autofillOverlayElementClosed: ({ message }) => this.overlayElementClosed(message),
    autofillOverlayAddNewVaultItem: ({ message, sender }) => this.addNewVaultItem(message, sender),
    checkAutofillOverlayFocused: () => this.checkOverlayFocused(),
    focusAutofillOverlayList: () => this.focusOverlayList(),
    updateAutofillOverlayPosition: ({ message }) => this.updateOverlayPosition(message),
    updateAutofillOverlayHidden: ({ message }) => this.updateOverlayHidden(message),
    updateFocusedFieldData: ({ message }) => this.setFocusedFieldData(message),
    collectPageDetailsResponse: ({ message, sender }) => this.storePageDetails(message, sender),
    unlockCompleted: ({ message }) => this.unlockCompleted(message),
    addEditCipherSubmitted: () => this.updateAutofillOverlayCiphers(),
    deletedCipher: () => this.updateAutofillOverlayCiphers(),
  };
  private readonly overlayButtonPortMessageHandlers: OverlayButtonPortMessageHandlers = {
    overlayButtonClicked: ({ port }) => this.handleOverlayButtonClicked(port),
    closeAutofillOverlay: ({ port }) => this.closeAutofillOverlay(port),
    overlayPageBlurred: () => this.checkOverlayListFocused(),
    redirectOverlayFocusOut: ({ message, port }) => this.redirectOverlayFocusOut(message, port),
  };
  private readonly overlayListPortMessageHandlers: OverlayListPortMessageHandlers = {
    checkAutofillOverlayButtonFocused: () => this.checkAutofillOverlayButtonFocused(),
    overlayPageBlurred: () => this.checkAutofillOverlayButtonFocused(),
    unlockVault: ({ port }) => this.unlockVault(port),
    autofillSelectedListItem: ({ message, port }) => this.autofillOverlayListItem(message, port),
    addNewVaultItem: ({ port }) => this.getNewVaultItemDetails(port),
    viewSelectedCipher: ({ message, port }) => this.viewSelectedCipher(message, port),
    redirectOverlayFocusOut: ({ message, port }) => this.redirectOverlayFocusOut(message, port),
  };

  constructor(
    private cipherService: CipherService,
    private autofillService: AutofillService,
    private authService: AuthService,
    private environmentService: EnvironmentService,
    private settingsService: SettingsService,
    private stateService: StateService,
    private i18nService: I18nService
  ) {
    this.iconsServerUrl = this.environmentService.getIconsUrl();
    this.getAuthStatus().catch((error) => {
      throw new Error(`Error getting auth status: ${error}`);
    });
    this.setupExtensionMessageListeners();

    // TODO: CG - ENSURE THAT THE ENGINEERING TEAM HAS A DISCUSSION ABOUT THE IMPLICATIONS OF THE USAGE OF THIS METHOD.
    // this.overrideUserAutofillSettings();
  }

  removePageDetails(tabId: number) {
    delete this.pageDetailsForTab[tabId];
  }

  async updateAutofillOverlayCiphers() {
    if (this.userAuthStatus !== AuthenticationStatus.Unlocked) {
      return;
    }

    const currentTab = await BrowserApi.getTabFromCurrentWindowId();
    if (!currentTab?.url) {
      return;
    }

    this.overlayCiphers = new Map();
    const ciphers = (await this.cipherService.getAllDecryptedForUrl(currentTab.url)).sort((a, b) =>
      this.cipherService.sortCiphersByLastUsedThenName(a, b)
    );
    for (let cipherIndex = 0; cipherIndex < ciphers.length; cipherIndex++) {
      this.overlayCiphers.set(`overlay-cipher-${cipherIndex}`, ciphers[cipherIndex]);
    }

    this.overlayListPort?.postMessage({
      command: "updateOverlayListCiphers",
      ciphers: this.getOverlayCipherData(),
    });
  }

  private getOverlayCipherData(): OverlayCipherData[] {
    const isFaviconDisabled = this.settingsService.getDisableFavicon();
    const overlayCiphersArray = Array.from(this.overlayCiphers);
    const overlayCipherData = [];
    let cipherIconData: WebsiteIconData;

    for (let cipherIndex = 0; cipherIndex < overlayCiphersArray.length; cipherIndex++) {
      const [overlayCipherId, cipher] = overlayCiphersArray[cipherIndex];
      if (!cipherIconData) {
        cipherIconData = WebsiteIconService.buildCipherIconData(
          this.iconsServerUrl,
          cipher,
          isFaviconDisabled
        );
      }

      overlayCipherData.push({
        id: overlayCipherId,
        name: cipher.name,
        type: cipher.type,
        reprompt: cipher.reprompt,
        favorite: cipher.favorite,
        icon: cipherIconData,
        login:
          cipher.type === CipherType.Login
            ? { username: this.getObscureName(cipher.login.username) }
            : null,
        card:
          cipher.type === CipherType.Card
            ? { brand: cipher.card.brand, partialNumber: `*${cipher.card.number?.slice(-4)}` }
            : null,
      });
    }

    return overlayCipherData;
  }

  private storePageDetails(
    message: OverlayBackgroundExtensionMessage,
    sender: chrome.runtime.MessageSender
  ) {
    const pageDetails = {
      frameId: sender.frameId,
      tab: sender.tab,
      details: message.details,
    };

    if (this.pageDetailsForTab[sender.tab.id]?.length) {
      this.pageDetailsForTab[sender.tab.id].push(pageDetails);
      return;
    }

    this.pageDetailsForTab[sender.tab.id] = [pageDetails];
  }

  private async autofillOverlayListItem(
    { overlayCipherId }: OverlayBackgroundExtensionMessage,
    { sender }: chrome.runtime.Port
  ) {
    if (!overlayCipherId) {
      return;
    }

    const cipher = this.overlayCiphers.get(overlayCipherId);

    if (await this.autofillService.isPasswordRepromptRequired(cipher, sender.tab)) {
      return;
    }
    await this.autofillService.doAutoFill({
      tab: sender.tab,
      cipher: cipher,
      pageDetails: this.pageDetailsForTab[sender.tab.id],
      fillNewPassword: true,
      allowTotpAutofill: true,
    });

    this.overlayCiphers = new Map([[overlayCipherId, cipher], ...this.overlayCiphers]);
  }

  private checkOverlayFocused() {
    if (this.overlayListPort) {
      this.checkOverlayListFocused();

      return;
    }

    this.checkAutofillOverlayButtonFocused();
  }

  private checkAutofillOverlayButtonFocused() {
    this.overlayButtonPort?.postMessage({ command: "checkAutofillOverlayButtonFocused" });
  }

  private checkOverlayListFocused() {
    this.overlayListPort?.postMessage({ command: "checkOverlayListFocused" });
  }

  private closeAutofillOverlay({ sender }: chrome.runtime.Port) {
    BrowserApi.tabSendMessage(sender.tab, { command: "closeAutofillOverlay" });
  }

  private overlayElementClosed({ overlayElement }: OverlayBackgroundExtensionMessage) {
    if (overlayElement === AutofillOverlayElement.Button) {
      this.overlayButtonPort?.disconnect();
      this.overlayButtonPort = null;

      return;
    }

    this.overlayListPort?.disconnect();
    this.overlayListPort = null;
  }

  private updateOverlayPosition({ overlayElement }: { overlayElement?: string }) {
    if (!overlayElement) {
      return;
    }

    if (overlayElement === AutofillOverlayElement.Button) {
      this.overlayButtonPort?.postMessage({
        command: "updateIframePosition",
        position: this.getOverlayButtonPosition(),
      });

      return;
    }

    this.overlayListPort?.postMessage({
      command: "updateIframePosition",
      position: this.getOverlayListPosition(),
    });
  }

  private getOverlayButtonPosition() {
    if (!this.focusedFieldData) {
      return;
    }

    const { top, left, width, height } = this.focusedFieldData.focusedFieldRects;
    const { paddingRight, paddingLeft } = this.focusedFieldData.focusedFieldStyles;
    const elementOffset = height * 0.37;
    const elementHeight = height - elementOffset;
    const elementTopPosition = top + elementOffset / 2;
    let elementLeftPosition = left + width - height + elementOffset / 2;

    const fieldPaddingRight = parseInt(paddingRight, 10);
    const fieldPaddingLeft = parseInt(paddingLeft, 10);
    if (fieldPaddingRight > fieldPaddingLeft) {
      elementLeftPosition = left + width - height - (fieldPaddingRight - elementOffset + 2);
    }

    return {
      top: `${elementTopPosition}px`,
      left: `${elementLeftPosition}px`,
      height: `${elementHeight}px`,
      width: `${elementHeight}px`,
    };
  }

  private getOverlayListPosition() {
    const { top, left, width, height } = this.focusedFieldData.focusedFieldRects;

    return {
      width: `${width}px`,
      top: `${top + height}px`,
      left: `${left}px`,
    };
  }

  private setFocusedFieldData({ focusedFieldData }: OverlayBackgroundExtensionMessage) {
    this.focusedFieldData = focusedFieldData;
  }

  private updateOverlayHidden({ display }: OverlayBackgroundExtensionMessage) {
    if (!display) {
      return;
    }

    const portMessage = {
      command: "updateOverlayHidden",
      display,
    };

    this.overlayButtonPort?.postMessage(portMessage);
    this.overlayListPort?.postMessage(portMessage);
  }

  private async openOverlay(focusFieldElement = false) {
    const currentTab = await BrowserApi.getTabFromCurrentWindowId();

    await BrowserApi.tabSendMessageData(currentTab, "openAutofillOverlay", {
      authStatus: await this.getAuthStatus(),
      focusFieldElement,
    });
  }

  private getObscureName(name: string): string {
    const [username, domain] = name.split("@");
    const usernameLength = username?.length;
    if (!usernameLength) {
      return name;
    }

    const startingCharacters = username.slice(0, usernameLength > 4 ? 2 : 1);
    let numberStars = usernameLength;
    if (usernameLength > 4) {
      numberStars = usernameLength < 6 ? numberStars - 1 : numberStars - 2;
    }

    let obscureName = `${startingCharacters}${new Array(numberStars).join("*")}`;
    if (usernameLength >= 6) {
      obscureName = `${obscureName}${username.slice(-1)}`;
    }

    return domain ? `${obscureName}@${domain}` : obscureName;
  }

  private async getAuthStatus() {
    const formerAuthStatus = this.userAuthStatus;
    this.userAuthStatus = await this.authService.getAuthStatus();

    if (
      this.userAuthStatus !== formerAuthStatus &&
      this.userAuthStatus === AuthenticationStatus.Unlocked
    ) {
      this.updateAutofillOverlayButtonAuthStatus();
      await this.updateAutofillOverlayCiphers();
    }

    return this.userAuthStatus;
  }

  private updateAutofillOverlayButtonAuthStatus() {
    if (!this.overlayButtonPort) {
      return;
    }

    this.overlayButtonPort.postMessage({
      command: "updateAutofillOverlayButtonAuthStatus",
      authStatus: this.userAuthStatus,
    });
  }

  private handleOverlayButtonClicked(port: chrome.runtime.Port) {
    if (this.userAuthStatus !== AuthenticationStatus.Unlocked) {
      this.unlockVault(port);
      return;
    }

    this.openOverlay();
  }

  private async unlockVault(port: chrome.runtime.Port) {
    const { sender } = port;

    this.closeAutofillOverlay(port);
    const retryMessage: LockedVaultPendingNotificationsItem = {
      commandToRetry: { msg: { command: "openAutofillOverlay" }, sender },
      target: "overlay.background",
    };
    await BrowserApi.tabSendMessageData(
      sender.tab,
      "addToLockedVaultPendingNotifications",
      retryMessage
    );
    await BrowserApi.tabSendMessageData(sender.tab, "promptForLogin", { skipNotification: true });
  }

  private async viewSelectedCipher(
    { overlayCipherId }: OverlayBackgroundExtensionMessage,
    { sender }: chrome.runtime.Port
  ) {
    const cipher = this.overlayCiphers.get(overlayCipherId);
    if (!cipher) {
      return;
    }

    await BrowserApi.tabSendMessageData(sender.tab, "openViewCipher", {
      cipherId: cipher.id,
      action: "show-autofill-button",
    });
  }

  private focusOverlayList() {
    if (!this.overlayListPort) {
      return;
    }

    this.overlayListPort.postMessage({ command: "focusOverlayList" });
  }

  private async unlockCompleted(message: OverlayBackgroundExtensionMessage) {
    await this.getAuthStatus();

    if (message.data?.commandToRetry?.msg?.command === "openAutofillOverlay") {
      await this.openOverlay(true);
    }
  }

  private getTranslations() {
    if (!this.overlayPageTranslations) {
      this.overlayPageTranslations = {
        locale: BrowserApi.getUILanguage(),
        opensInANewWindow: this.i18nService.translate("opensInANewWindow"),
        buttonPageTitle: this.i18nService.translate("bitwardenOverlayButton"),
        toggleBitwardenVaultOverlay: this.i18nService.translate("toggleBitwardenVaultOverlay"),
        listPageTitle: this.i18nService.translate("bitwardenVault"),
        unlockYourAccount: this.i18nService.translate("unlockYourAccountToViewMatchingLogins"),
        unlockAccount: this.i18nService.translate("unlockAccount"),
        fillCredentialsFor: this.i18nService.translate("fillCredentialsFor"),
        partialUsername: this.i18nService.translate("partialUsername"),
        view: this.i18nService.translate("view"),
        noItemsToShow: this.i18nService.translate("noItemsToShow"),
        newItem: this.i18nService.translate("newItem"),
        addNewVaultItem: this.i18nService.translate("addNewVaultItem"),
      };
    }

    return this.overlayPageTranslations;
  }

  private redirectOverlayFocusOut(
    { direction }: OverlayBackgroundExtensionMessage,
    { sender }: chrome.runtime.Port
  ) {
    if (!direction) {
      return;
    }

    BrowserApi.tabSendMessageData(sender.tab, "redirectOverlayFocusOut", { direction });
  }

  private getNewVaultItemDetails({ sender }: chrome.runtime.Port) {
    BrowserApi.tabSendMessage(sender.tab, { command: "addNewVaultItemFromOverlay" });
  }

  private async addNewVaultItem(
    message: OverlayAddNewItemMessage,
    sender: chrome.runtime.MessageSender
  ) {
    if (!message.login) {
      return;
    }

    const uriView = new LoginUriView();
    uriView.uri = message.login.uri;

    const loginView = new LoginView();
    loginView.uris = [uriView];
    loginView.username = message.login.username || "";
    loginView.password = message.login.password || "";

    const cipherView = new CipherView();
    cipherView.name = (Utils.getHostname(message.login.uri) || message.login.hostname).replace(
      /^www\./,
      ""
    );
    cipherView.folderId = null;
    cipherView.type = CipherType.Login;
    cipherView.login = loginView;

    await this.stateService.setAddEditCipherInfo({
      cipher: cipherView,
      collectionIds: cipherView.collectionIds,
    });

    await BrowserApi.tabSendMessageData(sender.tab, "openAddEditCipher", {
      cipherId: cipherView.id,
    });
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
    const handler: CallableFunction | undefined = this.extensionMessageHandlers[message?.command];
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

  private handlePortOnConnect = async (port: chrome.runtime.Port) => {
    const isOverlayListPort = port.name === AutofillOverlayPort.List;

    if (isOverlayListPort) {
      this.overlayListPort = port;
    } else {
      this.overlayButtonPort = port;
    }

    port.onMessage.addListener(this.handleOverlayElementPortMessage);
    port.postMessage({
      command: `initAutofillOverlay${isOverlayListPort ? "List" : "Button"}`,
      authStatus: await this.getAuthStatus(),
      styleSheetUrl: chrome.runtime.getURL(`overlay/${isOverlayListPort ? "list" : "button"}.css`),
      translations: this.getTranslations(),
      ciphers: isOverlayListPort ? this.getOverlayCipherData() : null,
    });
    this.updateOverlayPosition({
      overlayElement: isOverlayListPort
        ? AutofillOverlayElement.List
        : AutofillOverlayElement.Button,
    });
  };

  private handleOverlayElementPortMessage = (message: any, port: chrome.runtime.Port) => {
    const command = message?.command;
    let handler: CallableFunction | undefined;

    if (port.name === AutofillOverlayPort.Button) {
      handler = this.overlayButtonPortMessageHandlers[command];
    }

    if (port.name === AutofillOverlayPort.List) {
      handler = this.overlayListPortMessageHandlers[command];
    }

    if (!handler) {
      return;
    }

    handler({ message, port });
  };

  // TODO: CG - ENSURE THAT THE ENGINEERING TEAM HAS A DISCUSSION ABOUT THE IMPLICATIONS OF THIS MODIFICATION.
  // Other password managers leverage this privacy API to force autofill settings to be disabled.
  // This helps with the user experience when using a third party password manager.
  // However, it overrides the users settings and can be considered a privacy concern.
  // If we approach using this API, we need to ensure that it is strictly an opt-in experience and
  // convey why a user might want to disable autofill in their browser.
  // Also worth noting that this API is only available in Chrome.
  /**
  private overrideUserAutofillSettings() {
    if (
      !chrome?.privacy?.services?.autofillAddressEnabled ||
      !chrome.privacy.services.autofillCreditCardEnabled
    ) {
      return;
    }

    chrome.privacy.services.autofillAddressEnabled.get({}, (details) => {
      const { levelOfControl, value } = details;
      if (
        levelOfControl === "controllable_by_this_extension" ||
        (levelOfControl === "controlled_by_this_extension" && value === true)
      ) {
        chrome.privacy.services.autofillAddressEnabled.set({ value: false });
      }
    });
    chrome.privacy.services.autofillCreditCardEnabled.get({}, function (details) {
      const { levelOfControl, value } = details;
      if (
        levelOfControl === "controllable_by_this_extension" ||
        (levelOfControl === "controlled_by_this_extension" && value === true)
      ) {
        chrome.privacy.services.autofillCreditCardEnabled.set({ value: false });
      }
    });
  }
  **/
}

export default OverlayBackground;

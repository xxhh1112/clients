import { Injectable } from "@angular/core";
import { fromEvent, Subscription } from "rxjs";

import BrowserPopoutType from "@bitwarden/common/enums/browser-popout-type.enum";

import { BrowserApi } from "../../platform/browser/browser-api";

@Injectable()
export class PopupUtilsService {
  private unloadSubscription: Subscription;

  constructor(private privateMode: boolean = false) {}

  inSidebar(win: Window): boolean {
    return this.urlContainsSearchParams(win, "uilocation", "sidebar");
  }

  inPopout(win: Window): boolean {
    return this.urlContainsSearchParams(win, "uilocation", "popout");
  }

  inSingleActionPopout(win: Window, popoutKey: string): boolean {
    return this.urlContainsSearchParams(win, "singleActionPopout", popoutKey);
  }

  private urlContainsSearchParams(win: Window, searchParam: string, searchValue: string): boolean {
    return (
      win.location.search !== "" &&
      win.location.search.indexOf(`${searchParam}=${searchValue}`) > -1
    );
  }

  inPopup(win: Window): boolean {
    return (
      win.location.search === "" ||
      win.location.search.indexOf("uilocation=") === -1 ||
      win.location.search.indexOf("uilocation=popup") > -1
    );
  }

  inPrivateMode(): boolean {
    return this.privateMode;
  }

  getContentScrollY(win: Window, scrollingContainer = "main"): number {
    const content = win.document.getElementsByTagName(scrollingContainer)[0];
    return content.scrollTop;
  }

  setContentScrollY(win: Window, scrollY: number, scrollingContainer = "main"): void {
    if (scrollY != null) {
      const content = win.document.getElementsByTagName(scrollingContainer)[0];
      content.scrollTop = scrollY;
    }
  }

  popOut(win: Window, href: string = null): void {
    const popoutUrl = href || win.location.href;
    const parsedUrl = new URL(popoutUrl);
    this.openPopout(`${parsedUrl.pathname}${parsedUrl.hash}`);

    if (this.inPopup(win)) {
      BrowserApi.closePopup(win);
    }
  }

  /**
   * Enables a pop-up warning before the user exits the window/tab, or navigates away.
   * This warns the user that they may lose unsaved data if they leave the page.
   * (Note: navigating within the Angular app will not trigger it because it's an SPA.)
   * Make sure you call `disableTabCloseWarning` when it is no longer relevant.
   */
  enableCloseTabWarning() {
    this.disableCloseTabWarning();

    this.unloadSubscription = fromEvent(window, "beforeunload").subscribe(
      (e: BeforeUnloadEvent) => {
        // Recommended method but not widely supported
        e.preventDefault();

        // Modern browsers do not display this message, it just needs to be a non-nullish value
        // Exact wording is determined by the browser
        const confirmationMessage = "";

        // Older methods with better support
        e.returnValue = confirmationMessage;
        return confirmationMessage;
      }
    );
  }

  /**
   * Disables the warning enabled by enableCloseTabWarning.
   */
  disableCloseTabWarning() {
    this.unloadSubscription?.unsubscribe();
  }

  async openUnlockPopout(senderWindowId: number) {
    await this.openPopout("popup/index.html?uilocation=popout", {
      singleActionPopoutKey: BrowserPopoutType.UnlockVault,
      senderWindowId,
    });
  }

  async closeUnlockPopout() {
    await this.closeSingleActionPopout(BrowserPopoutType.UnlockVault);
  }

  async openPasswordRepromptPopout(
    senderWindowId: number,
    {
      cipherId,
      senderTabId,
      action,
    }: {
      cipherId: string;
      senderTabId: number;
      action: string;
    }
  ) {
    const promptWindowPath =
      "popup/index.html#/view-cipher" +
      "?uilocation=popout" +
      `&cipherId=${cipherId}` +
      `&senderTabId=${senderTabId}` +
      `&action=${action}`;

    await this.openPopout(promptWindowPath, {
      singleActionPopoutKey: BrowserPopoutType.PasswordReprompt,
      senderWindowId,
    });
  }

  async openAddEditCipherPopout(cipherId: number, senderWindowId: number): Promise<void> {
    const addEditCipherUrl =
      cipherId == null
        ? "popup/index.html#/edit-cipher"
        : `popup/index.html#/edit-cipher?cipherId=${cipherId}`;

    await this.openPopout(addEditCipherUrl, {
      singleActionPopoutKey: BrowserPopoutType.AddEditCipher,
      senderWindowId,
    });
  }

  async closeAddEditCipherPopout(delayClose = 0) {
    await this.closeSingleActionPopout(BrowserPopoutType.AddEditCipher, delayClose);
  }

  async openTwoFactorAuthPopout(message: { data: string; remember: string }) {
    const { data, remember } = message;
    const params =
      `webAuthnResponse=${encodeURIComponent(data)};` + `remember=${encodeURIComponent(remember)}`;
    const twoFactorUrl = `popup/index.html#/2fa;${params}`;

    await this.openPopout(twoFactorUrl, { singleActionPopoutKey: BrowserPopoutType.TwoFactorAuth });
  }

  async closeTwoFactorAuthPopout() {
    await this.closeSingleActionPopout(BrowserPopoutType.TwoFactorAuth);
  }

  async openAuthResultPopout(message: { code: string; state: string }) {
    const { code, state } = message;
    const authResultUrl = `popup/index.html?uilocation=popout#/sso?code=${encodeURIComponent(
      code
    )}&state=${encodeURIComponent(state)}`;

    await this.openPopout(authResultUrl, {
      singleActionPopoutKey: BrowserPopoutType.SsoAuthResult,
    });
  }

  private async openPopout(
    popupWindowUrl: string,
    options: {
      senderWindowId?: number;
      singleActionPopoutKey?: string;
      windowOptionsOverrides?: Partial<chrome.windows.CreateData>;
    } = {}
  ) {
    const { senderWindowId, singleActionPopoutKey, windowOptionsOverrides } = options;
    const defaultPopoutWindowOptions: chrome.windows.CreateData = {
      type: "normal",
      focused: true,
      width: 500,
      height: 800,
      ...windowOptionsOverrides,
    };
    const offsetRight = 15;
    const offsetTop = 90;
    const popupWidth = defaultPopoutWindowOptions.width;
    const senderWindow = await BrowserApi.getWindow(senderWindowId);
    const url = chrome.extension.getURL(popupWindowUrl);
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.set("uilocation", "popout");
    if (singleActionPopoutKey) {
      parsedUrl.searchParams.set("singleActionPopout", singleActionPopoutKey);
    }
    const windowOptions = {
      ...defaultPopoutWindowOptions,
      url: parsedUrl.toString(),
      left: senderWindow.left + senderWindow.width - popupWidth - offsetRight,
      top: senderWindow.top + offsetTop,
    };

    if (
      singleActionPopoutKey &&
      (await this.isSingleActionPopoutOpen(singleActionPopoutKey, windowOptions))
    ) {
      return;
    }

    return await BrowserApi.createWindow(windowOptions);
  }

  private async isSingleActionPopoutOpen(
    popoutKey: string,
    windowInfo: chrome.windows.CreateData
  ): Promise<boolean> {
    let isPopoutOpen = false;
    let singleActionPopoutFound = false;
    const extensionUrl = chrome.runtime.getURL("popup/index.html");
    const tabs = await BrowserApi.tabsQuery({ url: `${extensionUrl}*` });
    if (tabs.length === 0) {
      return isPopoutOpen;
    }

    for (let index = 0; index < tabs.length; index++) {
      const tab = tabs[index];
      if (!tab.url.includes(`singleActionPopout=${popoutKey}`)) {
        continue;
      }

      isPopoutOpen = true;
      if (!singleActionPopoutFound) {
        await BrowserApi.updateWindowProperties(tab.windowId, {
          focused: true,
          width: windowInfo.width,
          height: windowInfo.height,
          top: windowInfo.top,
          left: windowInfo.left,
        });
        singleActionPopoutFound = true;
        continue;
      }

      BrowserApi.removeTab(tab.id);
    }

    return isPopoutOpen;
  }

  async closeSingleActionPopout(popoutKey: string, delayClose = 0): Promise<void> {
    const extensionUrl = chrome.extension.getURL("popup/index.html");
    const tabs = await BrowserApi.tabsQuery({ url: `${extensionUrl}*` });
    for (const tab of tabs) {
      if (!tab.url.includes(`singleActionPopout=${popoutKey}`)) {
        continue;
      }

      setTimeout(() => {
        BrowserApi.removeTab(tab.id);
      }, delayClose);
    }
  }
}

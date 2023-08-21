import { BrowserApi } from "../browser/browser-api";

import { BrowserPopoutWindowService as BrowserPopupWindowServiceInterface } from "./abstractions/browser-popout-window.service";

class BrowserPopoutWindowService implements BrowserPopupWindowServiceInterface {
  private singleActionPopoutTabIds: Record<string, number> = {};
  private defaultPopoutWindowOptions: chrome.windows.CreateData = {
    type: "normal",
    focused: true,
    width: 500,
    height: 800,
  };

  async openUnlockPrompt(senderWindowId: number) {
    await this.closeUnlockPrompt();
    await this.openSingleActionPopout(
      senderWindowId,
      "popup/index.html?uilocation=popout",
      "unlockPrompt"
    );
  }

  async closeUnlockPrompt() {
    await this.closeSingleActionPopout("unlockPrompt");
  }

  async openPasswordRepromptPrompt(
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
    await this.closePasswordRepromptPrompt();

    const promptWindowPath =
      "popup/index.html#/view-cipher" +
      "?uilocation=popout" +
      `&cipherId=${cipherId}` +
      `&senderTabId=${senderTabId}` +
      `&action=${action}`;

    await this.openSingleActionPopout(senderWindowId, promptWindowPath, "passwordReprompt");
  }

  async closePasswordRepromptPrompt() {
    await this.closeSingleActionPopout("passwordReprompt");
  }

  async openAddEditCipherWindow(senderWindowId: number, cipherId?: string) {
    await this.closeAddEditCipherWindow();
    await this.openSingleActionPopout(
      senderWindowId,
      cipherId == null
        ? "popup/index.html#/edit-cipher"
        : `popup/index.html#/edit-cipher?cipherId=${cipherId}`,
      "addEditCipher"
    );
  }

  async closeAddEditCipherWindow() {
    await this.closeSingleActionPopout("addEditCipher");
  }

  async openViewCipherWindow(senderWindowId: number, cipherId: string) {
    if (!cipherId) {
      return;
    }

    await this.closeViewCipherWindow();
    await this.openSingleActionPopout(
      senderWindowId,
      `popup/index.html#/view-cipher?cipherId=${cipherId}`,
      "viewCipher"
    );
  }

  async closeViewCipherWindow() {
    await this.closeSingleActionPopout("viewCipher");
  }

  private async openSingleActionPopout(
    senderWindowId: number,
    popupWindowUrl: string,
    singleActionPopoutKey: string
  ) {
    const senderWindow = senderWindowId && (await BrowserApi.getWindow(senderWindowId));
    let url = chrome.extension.getURL(popupWindowUrl);
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.set("uilocation", "popout");
    parsedUrl.searchParams.set("singleActionPopout", singleActionPopoutKey);
    url = parsedUrl.toString();
    const offsetRight = 15;
    const offsetTop = 90;
    const popupWidth = this.defaultPopoutWindowOptions.width;
    const windowOptions = senderWindow
      ? {
          ...this.defaultPopoutWindowOptions,
          url,
          left: senderWindow.left + senderWindow.width - popupWidth - offsetRight,
          top: senderWindow.top + offsetTop,
        }
      : { ...this.defaultPopoutWindowOptions, url };

    const popupWindow = await BrowserApi.createWindow(windowOptions);

    if (!singleActionPopoutKey) {
      return;
    }
    this.singleActionPopoutTabIds[singleActionPopoutKey] = popupWindow?.tabs[0].id;
  }

  private async closeSingleActionPopout(popoutKey: string) {
    const tabId = this.singleActionPopoutTabIds[popoutKey];
    if (!tabId) {
      return;
    }

    await BrowserApi.removeTab(tabId);
    this.singleActionPopoutTabIds[popoutKey] = null;
  }
}

export default BrowserPopoutWindowService;

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

  async openLoginPrompt(senderWindowId: number) {
    await this.closeLoginPrompt();
    await this.openPopoutWindow(
      senderWindowId,
      "popup/index.html?uilocation=popout",
      "loginPrompt"
    );
  }

  async closeLoginPrompt() {
    await this.closeSingleActionPopout("loginPrompt");
  }

  async openAddEditCipherWindow(senderWindowId: number, cipherId?: string) {
    await this.closeAddEditCipherWindow();
    await this.openPopoutWindow(
      senderWindowId,
      cipherId == null
        ? "popup/index.html?uilocation=popout#/edit-cipher"
        : `popup/index.html?uilocation=popout#/edit-cipher?cipherId=${cipherId}`,
      "addEditCipher"
    );
  }

  async closeAddEditCipherWindow() {
    await this.closeSingleActionPopout("addEditCipher");
  }

  private async openPopoutWindow(
    senderWindowId: number,
    popupWindowUrl: string,
    singleActionPopoutKey: string
  ) {
    const senderWindow = senderWindowId && (await BrowserApi.getWindow(senderWindowId));
    let url = chrome.extension.getURL(popupWindowUrl);
    if (!url.includes("uilocation=popout")) {
      const parsedUrl = new URL(url);
      parsedUrl.searchParams.set("uilocation", "popout");
      url = parsedUrl.toString();
    }
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

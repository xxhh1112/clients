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

  async openFido2Popout(
    senderWindowId: number,
    {
      sessionId,
      senderTabId,
    }: {
      sessionId: string;
      senderTabId: number;
    }
  ): Promise<void> {
    await this.closeFido2Popout();

    const promptWindowPath =
      "popup/index.html#/fido2" +
      "?uilocation=popout" +
      `&sessionId=${sessionId}` +
      `&senderTabId=${senderTabId}`;

    await this.openSingleActionPopout(senderWindowId, promptWindowPath, "fido2Popout", {
      width: 200,
      height: 500,
    });
  }

  async closeFido2Popout(): Promise<void> {
    await this.closeSingleActionPopout("fido2Popout");
  }

  private async openSingleActionPopout(
    senderWindowId: number,
    popupWindowURL: string,
    singleActionPopoutKey: string,
    customDimensions: { width?: number; height?: number } = {}
  ) {
    const senderWindow = senderWindowId && (await BrowserApi.getWindow(senderWindowId));
    const url = chrome.extension.getURL(popupWindowURL);
    const offsetRight = 15;
    const offsetTop = 90;
    // Use custom dimensions if provided, otherwise use default
    const popupWidth = customDimensions.width || this.defaultPopoutWindowOptions.width;
    const windowOptions = senderWindow
      ? {
          ...this.defaultPopoutWindowOptions,
          ...customDimensions,
          url,
          left: senderWindow.left + senderWindow.width - popupWidth - offsetRight,
          top: senderWindow.top + offsetTop,
        }
      : { ...this.defaultPopoutWindowOptions, ...customDimensions, url };

    const popupWindow = await BrowserApi.createWindow(windowOptions);

    await this.closeSingleActionPopout(singleActionPopoutKey);
    this.singleActionPopoutTabIds[singleActionPopoutKey] = popupWindow?.tabs[0].id;
  }

  private async closeSingleActionPopout(popoutKey: string) {
    const tabId = this.singleActionPopoutTabIds[popoutKey];

    if (tabId) {
      await BrowserApi.removeTab(tabId);
    }
    this.singleActionPopoutTabIds[popoutKey] = null;
  }
}

export default BrowserPopoutWindowService;

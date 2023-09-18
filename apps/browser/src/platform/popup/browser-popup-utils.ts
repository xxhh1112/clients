import { BrowserApi } from "../browser/browser-api";

class BrowserPopupUtils {
  static inSidebar(win: Window): boolean {
    return BrowserPopupUtils.urlContainsSearchParams(win, "uilocation", "sidebar");
  }

  static inPopout(win: Window): boolean {
    return BrowserPopupUtils.urlContainsSearchParams(win, "uilocation", "popout");
  }

  static inSingleActionPopout(win: Window, popoutKey: string): boolean {
    return BrowserPopupUtils.urlContainsSearchParams(win, "singleActionPopout", popoutKey);
  }

  static inPopup(win: Window): boolean {
    return (
      win.location.search === "" ||
      win.location.search.indexOf("uilocation=") === -1 ||
      win.location.search.indexOf("uilocation=popup") > -1
    );
  }

  static getContentScrollY(win: Window, scrollingContainer = "main"): number {
    const content = win.document.getElementsByTagName(scrollingContainer)[0];
    return content.scrollTop;
  }

  static setContentScrollY(win: Window, scrollY: number, scrollingContainer = "main"): void {
    if (scrollY != null) {
      const content = win.document.getElementsByTagName(scrollingContainer)[0];
      content.scrollTop = scrollY;
    }
  }

  static backgroundInitializationRequired() {
    return BrowserApi.getBackgroundPage() === null;
  }

  static loadingInPrivateMode() {
    return BrowserPopupUtils.backgroundInitializationRequired() && BrowserApi.manifestVersion !== 3;
  }

  static async openPopout(
    url: string,
    options: {
      senderWindowId?: number;
      singleActionKey?: string;
      forceCloseExistingWindows?: boolean;
      windowOptions?: Partial<chrome.windows.CreateData>;
    } = {}
  ) {
    const { senderWindowId, singleActionKey, forceCloseExistingWindows, windowOptions } = options;
    const defaultPopoutWindowOptions: chrome.windows.CreateData = {
      type: "normal",
      focused: true,
      width: 500,
      height: 800,
    };
    const offsetRight = 15;
    const offsetTop = 90;
    const popupWidth = defaultPopoutWindowOptions.width;
    const senderWindow = await BrowserApi.getWindow(senderWindowId);
    const parsedUrl = new URL(chrome.runtime.getURL(url));
    parsedUrl.searchParams.set("uilocation", "popout");
    if (singleActionKey) {
      parsedUrl.searchParams.set("singleActionPopout", singleActionKey);
    }
    const popoutWindowOptions = {
      left: senderWindow.left + senderWindow.width - popupWidth - offsetRight,
      top: senderWindow.top + offsetTop,
      ...defaultPopoutWindowOptions,
      ...windowOptions,
      url: parsedUrl.toString(),
    };

    if (
      (await BrowserPopupUtils.isSingleActionPopoutOpen(
        singleActionKey,
        popoutWindowOptions,
        forceCloseExistingWindows
      )) &&
      !forceCloseExistingWindows
    ) {
      return;
    }

    return await BrowserApi.createWindow(popoutWindowOptions);
  }

  static async closeSingleActionPopout(popoutKey: string, delayClose = 0): Promise<void> {
    const extensionUrl = chrome.runtime.getURL("popup/index.html");
    const tabs = await BrowserApi.tabsQuery({ url: `${extensionUrl}*` });
    for (const tab of tabs) {
      if (!tab.url.includes(`singleActionPopout=${popoutKey}`)) {
        continue;
      }

      setTimeout(() => BrowserApi.removeTab(tab.id), delayClose);
    }
  }

  private static async isSingleActionPopoutOpen(
    popoutKey: string | undefined,
    windowInfo: chrome.windows.CreateData,
    forceCloseExistingWindows = false
  ) {
    let isPopoutOpen = false;
    let singleActionPopoutFound = false;
    if (!popoutKey) {
      return isPopoutOpen;
    }

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
      if (!forceCloseExistingWindows && !singleActionPopoutFound) {
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

  private static urlContainsSearchParams(
    win: Window,
    searchParam: string,
    searchValue: string
  ): boolean {
    return (
      win.location.search !== "" &&
      win.location.search.indexOf(`${searchParam}=${searchValue}`) > -1
    );
  }
}

export default BrowserPopupUtils;

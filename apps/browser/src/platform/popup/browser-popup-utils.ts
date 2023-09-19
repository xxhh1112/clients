import { BrowserApi } from "../browser/browser-api";

class BrowserPopupUtils {
  /**
   * Identifies if the popup is within the sidebar.
   * @param {Window} win
   * @returns {boolean}
   */
  static inSidebar(win: Window): boolean {
    return BrowserPopupUtils.urlContainsSearchParams(win, "uilocation", "sidebar");
  }

  /**
   * Identifies if the popup is within the popout.
   * @param {Window} win
   * @returns {boolean}
   */
  static inPopout(win: Window): boolean {
    return BrowserPopupUtils.urlContainsSearchParams(win, "uilocation", "popout");
  }

  /**
   * Identifies if the popup is within the single action popout.
   * @param {Window} win
   * @param {string} popoutKey
   * @returns {boolean}
   */
  static inSingleActionPopout(win: Window, popoutKey: string): boolean {
    return BrowserPopupUtils.urlContainsSearchParams(win, "singleActionPopout", popoutKey);
  }

  /**
   * Identifies if the popup is within the popup.
   * @param {Window} win
   * @returns {boolean}
   */
  static inPopup(win: Window): boolean {
    return (
      win.location.search === "" ||
      win.location.search.indexOf("uilocation=") === -1 ||
      win.location.search.indexOf("uilocation=popup") > -1
    );
  }

  /**
   * Gets the scroll position of the popup.
   * @param {Window} win
   * @param {string} scrollingContainer
   * @returns {number}
   */
  static getContentScrollY(win: Window, scrollingContainer = "main"): number {
    const content = win.document.getElementsByTagName(scrollingContainer)[0];
    return content.scrollTop;
  }

  /**
   * Sets the scroll position of the popup.
   * @param {Window} win
   * @param {number} scrollY
   * @param {string} scrollingContainer
   */
  static setContentScrollY(win: Window, scrollY: number, scrollingContainer = "main"): void {
    if (scrollY != null) {
      const content = win.document.getElementsByTagName(scrollingContainer)[0];
      content.scrollTop = scrollY;
    }
  }

  /**
   * Identifies if the background page needs to be initialized.
   * @returns {boolean}
   */
  static backgroundInitializationRequired() {
    return BrowserApi.getBackgroundPage() === null;
  }

  /**
   * Identifies if the popup is loading in private mode.
   * @returns {boolean}
   */
  static inPrivateMode() {
    return BrowserPopupUtils.backgroundInitializationRequired() && BrowserApi.manifestVersion !== 3;
  }

  /**
   * Opens a popout window of any extension page. If the popout window is already open, it will be focused.
   * @param {string} extensionUrlPath
   * @param {{senderWindowId?: number, singleActionKey?: string, forceCloseExistingWindows?: boolean, windowOptions?: Partial<chrome.windows.CreateData>}} options
   * @returns {Promise<chrome.windows.Window>}
   */
  static async openPopout(
    extensionUrlPath: string,
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
    const parsedUrl = new URL(chrome.runtime.getURL(extensionUrlPath));
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

  /**
   * Closes the single action popout window.
   * @param {string} popoutKey
   * @param {number} delayClose
   * @returns {Promise<void>}
   */
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

  /**
   * Opens a popout window for the current page.
   * If the current page is set for the current tab, then the
   * popout window will be set for the vault items listing tab.
   * @param win The passed window object.
   * @param href The passed href to open.
   */
  static async openCurrentPagePopout(win: Window, href: string = null) {
    const popoutUrl = href || win.location.href;
    const parsedUrl = new URL(popoutUrl);
    let hashRoute = parsedUrl.hash;
    if (hashRoute.startsWith("#/tabs/current")) {
      hashRoute = "#/tabs/vault";
    }

    await BrowserPopupUtils.openPopout(`${parsedUrl.pathname}${hashRoute}`);

    if (BrowserPopupUtils.inPopup(win)) {
      BrowserApi.closePopup(win);
    }
  }

  /**
   * Identifies if a single action window is open based on the passed popoutKey.
   * Will focus the existing window, and close any other windows that might exist
   * with the same popout key.
   * @param {string | undefined} popoutKey
   * @param {chrome.windows.CreateData} windowInfo
   * @param {boolean} forceCloseExistingWindows
   * @returns {Promise<boolean>}
   * @private
   */
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

  /**
   * Identifies if the url contains the specified search param and value.
   * @param {Window} win
   * @param {string} searchParam
   * @param {string} searchValue
   * @returns {boolean}
   * @private
   */
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

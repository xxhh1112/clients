import MainBackground from "../../background/main.background";

import NotificationBackground from "./notification.background";
import OverlayBackground from "./overlay.background";

export default class TabsBackground {
  constructor(
    private main: MainBackground,
    private notificationBackground: NotificationBackground,
    private overlayBackground: OverlayBackground
  ) {}

  private focusedWindowId: number;

  async init() {
    if (!chrome.tabs || !chrome.windows) {
      return;
    }

    chrome.windows.onFocusChanged.addListener(this.handleWindowOnFocusChanged);
    chrome.tabs.onActivated.addListener(this.handleTabOnActivated);
    chrome.tabs.onReplaced.addListener(this.handleTabOnReplaced);
    chrome.tabs.onUpdated.addListener(this.handleTabOnUpdated);
    chrome.tabs.onRemoved.addListener(this.handleTabOnRemoved);
  }

  private handleWindowOnFocusChanged = async (windowId: number) => {
    if (!windowId) {
      return;
    }

    this.focusedWindowId = windowId;
    await this.updateCurrentTabData();
    this.main.messagingService.send("windowChanged");
  };

  private handleTabOnActivated = async () => {
    await this.updateCurrentTabData();
    this.main.messagingService.send("tabChanged");
  };

  private handleTabOnReplaced = async () => {
    if (this.main.onReplacedRan) {
      return;
    }
    this.main.onReplacedRan = true;

    await this.notificationBackground.checkNotificationQueue();
    await this.updateCurrentTabData();
    this.main.messagingService.send("tabChanged");
  };

  private handleTabOnUpdated = async (
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
  ) => {
    if (changeInfo.status !== "complete") {
      this.overlayBackground.removePageDetails(tabId);
    }

    if (this.focusedWindowId && tab.windowId !== this.focusedWindowId) {
      return;
    }

    if (!tab.active) {
      return;
    }

    if (this.main.onUpdatedRan) {
      return;
    }
    this.main.onUpdatedRan = true;

    await this.notificationBackground.checkNotificationQueue(tab);
    await this.updateCurrentTabData();
    this.main.messagingService.send("tabChanged");
  };

  private handleTabOnRemoved = async (tabId: number) => {
    this.overlayBackground.removePageDetails(tabId);
  };

  private updateCurrentTabData = async () => {
    await this.main.refreshBadge();
    await this.main.refreshMenu();
    await this.overlayBackground.updateCurrentContextualCiphers();
  };
}

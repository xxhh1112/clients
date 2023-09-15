import { Injectable } from "@angular/core";
import { fromEvent, Subscription } from "rxjs";

import { BrowserApi } from "../../platform/browser/browser-api";
import PopoutWindow from "../../platform/popup/popout-window";

@Injectable()
export class PopupUtilsService {
  private unloadSubscription: Subscription;
  private isOpeningPopout = false;
  private openPopoutDebounce: NodeJS.Timeout;

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
    let hashRoute = parsedUrl.hash;
    if (hashRoute.startsWith("#/tabs/current")) {
      hashRoute = "#/tabs/vault";
    }

    PopoutWindow.open(`${parsedUrl.pathname}${hashRoute}`);

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
}

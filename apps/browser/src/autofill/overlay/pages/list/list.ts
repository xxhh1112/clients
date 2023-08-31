import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { OverlayListWindowMessageHandlers } from "../../abstractions/list";
import { AutofillOverlayElement, RedirectFocusDirection } from "../../utils/autofill-overlay.enum";
import { globeIcon, lockIcon, plusIcon, viewCipherIcon } from "../../utils/svg-icons";
import { buildSvgDomElement } from "../../utils/utils";

require("./list.scss");

class AutofillOverlayList extends HTMLElement {
  private shadowDom: ShadowRoot;
  private messageOrigin: string;
  private overlayListContainer: HTMLDivElement;
  private resizeObserver: ResizeObserver;
  private translations: Record<string, string>;
  private eventHandlersMemo: { [key: string]: EventListener } = {};
  private windowMessageHandlers: OverlayListWindowMessageHandlers = {
    initAutofillOverlayList: ({ message }) => this.initAutofillOverlayList(message),
    checkOverlayListFocused: () => this.checkOverlayListFocused(),
    updateOverlayListCiphers: ({ message }) => this.updateListItems(message),
    focusOverlayList: () => this.focusOverlayList(),
  };

  constructor() {
    super();

    this.shadowDom = this.attachShadow({ mode: "closed" });
    this.setupGlobalListeners();
  }

  private async initAutofillOverlayList(message: any) {
    this.translations = message.translations;
    globalThis.document.documentElement.setAttribute("lang", this.getTranslation("locale"));
    globalThis.document.head.title = this.getTranslation("listPageTitle");

    this.initShadowDom(message.styleSheetUrl);

    if (message.authStatus === AuthenticationStatus.Unlocked) {
      this.updateListItems(message);
      return;
    }

    this.buildLockedOverlay();
  }

  private initShadowDom(styleSheetUrl: string) {
    this.shadowDom.innerHTML = "";
    const linkElement = globalThis.document.createElement("link");
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("href", styleSheetUrl);

    this.overlayListContainer = globalThis.document.createElement("div");
    this.overlayListContainer.classList.add("overlay-list-container");
    this.overlayListContainer.setAttribute("role", "dialog");
    this.overlayListContainer.setAttribute("aria-modal", "true");
    this.resizeObserver.observe(this.overlayListContainer);

    this.shadowDom.append(linkElement, this.overlayListContainer);
  }

  private resetOverlayListContainer() {
    this.overlayListContainer.innerHTML = "";
  }

  private buildLockedOverlay() {
    this.resetOverlayListContainer();

    const lockedOverlay = globalThis.document.createElement("div");
    lockedOverlay.id = "locked-overlay-description";
    lockedOverlay.classList.add("locked-overlay", "overlay-list-message");
    lockedOverlay.textContent = this.getTranslation("unlockYourAccount");

    const unlockButtonElement = globalThis.document.createElement("button");
    unlockButtonElement.id = "unlock-button";
    unlockButtonElement.tabIndex = -1;
    unlockButtonElement.classList.add("unlock-button", "overlay-list-button");
    unlockButtonElement.textContent = this.getTranslation("unlockAccount");
    unlockButtonElement.setAttribute(
      "aria-label",
      `${this.getTranslation("unlockAccount")}, ${this.getTranslation("opensInANewWindow")}`
    );
    unlockButtonElement.prepend(buildSvgDomElement(lockIcon));
    unlockButtonElement.addEventListener("click", this.handleUnlockButtonClick);

    const overlayListButtonContainer = globalThis.document.createElement("div");
    overlayListButtonContainer.classList.add("overlay-list-button-container");
    overlayListButtonContainer.appendChild(unlockButtonElement);

    this.overlayListContainer.append(lockedOverlay, overlayListButtonContainer);
  }

  private handleUnlockButtonClick = () => {
    this.postMessageToParent({ command: "unlockVault" });
  };

  private updateListItems(message: any) {
    this.resetOverlayListContainer();

    if (!message.ciphers || message.ciphers.length === 0) {
      this.buildNoResultsOverlayList();
      return;
    }

    const ciphersList = globalThis.document.createElement("ul");
    ciphersList.classList.add("overlay-actions-list");
    ciphersList.setAttribute("role", "list");

    message.ciphers.forEach((cipher: any) =>
      ciphersList.appendChild(this.buildOverlayActionsListItem(cipher))
    );

    this.overlayListContainer.appendChild(ciphersList);
  }

  private buildOverlayActionsListItem(cipher: any) {
    const fillCipherElement = this.buildFillCipherElement(cipher);
    const viewCipherElement = this.buildViewCipherElement(cipher);

    const cipherContainerElement = globalThis.document.createElement("div");
    cipherContainerElement.classList.add("cipher-container");
    cipherContainerElement.append(fillCipherElement, viewCipherElement);

    const overlayActionsListItem = globalThis.document.createElement("li");
    overlayActionsListItem.setAttribute("role", "listitem");
    overlayActionsListItem.classList.add("overlay-actions-list-item");
    overlayActionsListItem.appendChild(cipherContainerElement);

    return overlayActionsListItem;
  }

  private buildFillCipherElement(cipher: any) {
    const cipherIcon = this.buildCipherIconElement(cipher);
    const cipherDetailsElement = this.buildCipherDetailsElement(cipher);

    const fillCipherElement = globalThis.document.createElement("button");
    fillCipherElement.tabIndex = -1;
    fillCipherElement.classList.add("fill-cipher-button");
    fillCipherElement.setAttribute(
      "aria-label",
      `${this.getTranslation("fillCredentialsFor")} ${cipher.name}`
    );
    fillCipherElement.setAttribute(
      "aria-description",
      `${this.getTranslation("partialUsername")}, ${cipher.login.username}`
    );
    fillCipherElement.append(cipherIcon, cipherDetailsElement);
    fillCipherElement.addEventListener("click", this.handleFillCipherClickEvent(cipher));
    fillCipherElement.addEventListener("keyup", this.handleFillCipherKeyUpEvent);

    return fillCipherElement;
  }

  private handleFillCipherClickEvent = (cipher: any) => {
    return this.useEventHandlersMemo(
      () =>
        this.postMessageToParent({
          command: "autofillSelectedListItem",
          overlayCipherId: cipher.id,
        }),
      `${cipher.id}-fill-cipher-button-click-handler`
    );
  };

  private handleFillCipherKeyUpEvent = (event: KeyboardEvent) => {
    const listenedForKeys = new Set(["ArrowDown", "ArrowUp", "ArrowRight"]);
    if (!listenedForKeys.has(event.key) || !(event.target instanceof Element)) {
      return;
    }

    event.preventDefault();

    const currentListItem = event.target.closest(".overlay-actions-list-item") as HTMLElement;
    if (event.key === "ArrowDown") {
      this.focusNextListItem(currentListItem);
      return;
    }

    if (event.key === "ArrowUp") {
      this.focusPreviousListItem(currentListItem);
      return;
    }

    this.focusViewCipherButton(currentListItem, event.target as HTMLElement);
  };

  private buildViewCipherElement(cipher: any) {
    const viewCipherElement = globalThis.document.createElement("button");
    viewCipherElement.tabIndex = -1;
    viewCipherElement.classList.add("view-cipher-button");
    viewCipherElement.setAttribute(
      "aria-label",
      `${this.getTranslation("view")} ${cipher.name}, ${this.getTranslation("opensInANewWindow")}`
    );
    viewCipherElement.append(buildSvgDomElement(viewCipherIcon));
    viewCipherElement.addEventListener("click", this.handleViewCipherClickEvent(cipher));
    viewCipherElement.addEventListener("keyup", this.handleViewCipherKeyUpEvent);

    return viewCipherElement;
  }

  private handleViewCipherClickEvent = (cipher: any) => {
    return this.useEventHandlersMemo(
      () => this.postMessageToParent({ command: "viewSelectedCipher", overlayCipherId: cipher.id }),
      `${cipher.id}-view-cipher-button-click-handler`
    );
  };

  private handleViewCipherKeyUpEvent = (event: KeyboardEvent) => {
    const listenedForKeys = new Set(["ArrowDown", "ArrowUp", "ArrowLeft"]);
    if (!listenedForKeys.has(event.key) || !(event.target instanceof Element)) {
      return;
    }

    event.preventDefault();

    const currentListItem = event.target.closest(".overlay-actions-list-item") as HTMLElement;
    const cipherContainer = currentListItem.querySelector(".cipher-container") as HTMLElement;
    cipherContainer?.classList.remove("remove-outline");
    if (event.key === "ArrowDown") {
      this.focusNextListItem(currentListItem);
      return;
    }

    if (event.key === "ArrowUp") {
      this.focusPreviousListItem(currentListItem);
      return;
    }

    const previousSibling = event.target.previousElementSibling as HTMLElement;
    previousSibling?.focus();
  };

  private buildCipherIconElement(cipher: any) {
    const cipherIcon = globalThis.document.createElement("span");
    cipherIcon.classList.add("cipher-icon");
    cipherIcon.setAttribute("aria-hidden", "true");

    if (cipher.icon?.image) {
      try {
        const url = new URL(cipher.icon.image);
        cipherIcon.style.backgroundImage = `url(${url.href})`;
        return cipherIcon;
      } catch {
        // Silently default to the globe icon element if the image URL is invalid
      }
    }

    if (cipher.icon?.icon) {
      cipherIcon.classList.add(`cipher-icon ${cipher.icon.icon}`);
      return cipherIcon;
    }

    cipherIcon.append(buildSvgDomElement(globeIcon));
    return cipherIcon;
  }

  private buildCipherDetailsElement(cipher: any) {
    const cipherNameElement = this.buildCipherNameElement(cipher);
    const cipherUserLoginElement = this.buildCipherUserLoginElement(cipher);

    const cipherDetailsElement = globalThis.document.createElement("span");
    cipherDetailsElement.classList.add("cipher-details");
    cipherDetailsElement.append(cipherNameElement, cipherUserLoginElement);

    return cipherDetailsElement;
  }

  private buildCipherNameElement(cipher: any) {
    const cipherNameElement = globalThis.document.createElement("span");
    cipherNameElement.classList.add("cipher-name");
    cipherNameElement.textContent = cipher.name;
    cipherNameElement.setAttribute("title", cipher.name);

    return cipherNameElement;
  }

  private buildCipherUserLoginElement(cipher: any) {
    const cipherUserLoginElement = globalThis.document.createElement("span");
    cipherUserLoginElement.classList.add("cipher-user-login");
    cipherUserLoginElement.textContent = cipher.login.username;
    cipherUserLoginElement.setAttribute("title", cipher.login.username);

    return cipherUserLoginElement;
  }

  private buildNoResultsOverlayList() {
    const noItemsMessage = globalThis.document.createElement("div");
    noItemsMessage.classList.add("no-items", "overlay-list-message");
    noItemsMessage.textContent = this.getTranslation("noItemsToShow");

    const newItemButton = globalThis.document.createElement("button");
    newItemButton.tabIndex = -1;
    newItemButton.id = "new-item-button";
    newItemButton.classList.add("add-new-item-button", "overlay-list-button");
    newItemButton.textContent = this.getTranslation("newItem");
    newItemButton.setAttribute(
      "aria-label",
      `${this.getTranslation("addNewVaultItem")}, ${this.getTranslation("opensInANewWindow")}`
    );
    newItemButton.prepend(buildSvgDomElement(plusIcon));
    newItemButton.addEventListener("click", this.handeNewItemButtonClick);

    const overlayListButtonContainer = globalThis.document.createElement("div");
    overlayListButtonContainer.classList.add("overlay-list-button-container");
    overlayListButtonContainer.appendChild(newItemButton);

    this.overlayListContainer.append(noItemsMessage, overlayListButtonContainer);
  }

  private handeNewItemButtonClick = () => {
    this.postMessageToParent({ command: "addNewVaultItem" });
  };

  private checkOverlayListFocused() {
    if (globalThis.document.hasFocus()) {
      return;
    }

    this.postMessageToParent({ command: "checkAutofillOverlayButtonFocused" });
  }

  private focusOverlayList() {
    const unlockButtonElement = this.overlayListContainer.querySelector(
      "#unlock-button"
    ) as HTMLElement;
    if (unlockButtonElement) {
      unlockButtonElement.focus();
      return;
    }

    const newItemButtonElement = this.overlayListContainer.querySelector(
      "#new-item-button"
    ) as HTMLElement;
    if (newItemButtonElement) {
      newItemButtonElement.focus();
      return;
    }

    const firstCipherElement = this.overlayListContainer.querySelector(
      ".fill-cipher-button"
    ) as HTMLElement;
    firstCipherElement?.focus();
  }

  private postMessageToParent(message: any) {
    if (!this.messageOrigin) {
      return;
    }

    globalThis.parent.postMessage(message, this.messageOrigin);
  }

  private setupGlobalListeners() {
    globalThis.addEventListener("message", this.handleWindowMessage);
    globalThis.addEventListener("blur", this.handleWindowBlurEvent);
    globalThis.document.addEventListener("keydown", this.handleDocumentKeyDownEvent);
    this.resizeObserver = new ResizeObserver(this.handleResizeObserver);
  }

  private handleWindowMessage = (event: MessageEvent) => {
    if (!this.messageOrigin) {
      this.messageOrigin = event.origin;
    }

    const message = event?.data;
    const handler = this.windowMessageHandlers[message?.command];
    if (!handler) {
      return;
    }

    handler({ message });
  };

  private handleWindowBlurEvent = () => {
    this.postMessageToParent({ command: "checkAutofillOverlayButtonFocused" });
  };

  private handleDocumentKeyDownEvent = (event: KeyboardEvent) => {
    const listenedForKeys = new Set(["Tab", "Escape"]);
    if (!listenedForKeys.has(event.key)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (event.key === "Tab") {
      this.redirectOverlayFocusOutMessage(
        event.shiftKey ? RedirectFocusDirection.Previous : RedirectFocusDirection.Next
      );
      return;
    }

    this.redirectOverlayFocusOutMessage(RedirectFocusDirection.Current);
  };

  private redirectOverlayFocusOutMessage(direction: string) {
    this.postMessageToParent({ command: "redirectOverlayFocusOut", direction });
  }

  private handleResizeObserver = (entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.target !== this.overlayListContainer) {
        continue;
      }

      const { height } = entry.contentRect;
      this.postMessageToParent({ command: "updateAutofillOverlayListHeight", height });
      break;
    }
  };

  private getTranslation(key: string): string {
    return this.translations[key] || "";
  }

  private useEventHandlersMemo = (eventHandler: EventListener, memoIndex: string) => {
    return this.eventHandlersMemo[memoIndex] || (this.eventHandlersMemo[memoIndex] = eventHandler);
  };

  private focusNextListItem(currentListItem: HTMLElement) {
    const nextListItem = currentListItem.nextSibling as HTMLElement;
    const nextSibling = nextListItem?.querySelector(".fill-cipher-button") as HTMLElement;
    if (nextSibling) {
      nextSibling.focus();
      return;
    }

    const firstListItem = currentListItem.parentElement?.firstChild as HTMLElement;
    const firstSibling = firstListItem?.querySelector(".fill-cipher-button") as HTMLElement;
    firstSibling?.focus();
  }

  private focusPreviousListItem(currentListItem: HTMLElement) {
    const previousListItem = currentListItem.previousSibling as HTMLElement;
    const previousSibling = previousListItem?.querySelector(".fill-cipher-button") as HTMLElement;
    if (previousSibling) {
      previousSibling.focus();
      return;
    }

    const lastListItem = currentListItem.parentElement?.lastChild as HTMLElement;
    const lastSibling = lastListItem?.querySelector(".fill-cipher-button") as HTMLElement;
    lastSibling?.focus();
  }

  private focusViewCipherButton(currentListItem: HTMLElement, currentButtonElement: HTMLElement) {
    const cipherContainer = currentListItem.querySelector(".cipher-container") as HTMLElement;
    cipherContainer.classList.add("remove-outline");

    const nextSibling = currentButtonElement.nextElementSibling as HTMLElement;
    nextSibling?.focus();
  }
}

(function () {
  globalThis.customElements.define(AutofillOverlayElement.List, AutofillOverlayList);
})();

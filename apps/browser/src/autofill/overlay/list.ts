import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { OverlayListWindowMessageHandlers } from "./abstractions/list";
import { AutofillOverlayCustomElement } from "./utils/autofill-overlay.enum";
import { globeIcon, lockIcon, plusIcon, viewCipherIcon } from "./utils/svg-icons";
import { buildSvgDomElement } from "./utils/utils";

require("./list.scss");

class AutofillOverlayList extends HTMLElement {
  private authStatus: AuthenticationStatus;
  private shadowDom: ShadowRoot;
  private overlayListContainer: HTMLDivElement;
  private styleSheetUrl: string;
  private messageOrigin: string;
  private resizeObserver: ResizeObserver;
  private windowMessageHandlers: OverlayListWindowMessageHandlers = {
    initAutofillOverlayList: ({ message }) => this.initAutofillOverlayList(message),
    checkOverlayListFocused: () => this.checkOverlayListFocused(),
    updateOverlayListCiphers: ({ message }) => this.updateAutofillOverlayList(message),
    focusOverlayList: () => this.focusOverlayList(),
  };

  constructor() {
    super();

    this.shadowDom = this.attachShadow({ mode: "closed" });
    this.setupGlobalListeners();
  }

  private async initAutofillOverlayList(message: any = {}) {
    this.authStatus = message.authStatus;
    this.styleSheetUrl = message.styleSheetUrl;

    this.initShadowDom();

    globalThis.addEventListener("blur", this.handleWindowBlurEvent);
    if (this.authStatus === AuthenticationStatus.Unlocked) {
      this.updateAutofillOverlayList(message);
      return;
    }

    this.buildLockedOverlay();
  }

  private handleWindowBlurEvent = () => {
    this.postMessageToParent({ command: "checkOverlayIconFocused" });
  };

  private initShadowDom() {
    this.shadowDom.innerHTML = "";
    const styleSheetUrl = this.styleSheetUrl;
    const linkElement = globalThis.document.createElement("link");
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("href", styleSheetUrl);

    this.overlayListContainer = globalThis.document.createElement("div");
    this.overlayListContainer.className = "overlay-list-container";
    this.resizeObserver.observe(this.overlayListContainer);

    this.shadowDom.appendChild(linkElement);
    this.shadowDom.appendChild(this.overlayListContainer);
  }

  private resetOverlayListContainer() {
    this.overlayListContainer.innerHTML = "";
  }

  private buildLockedOverlay() {
    this.resetOverlayListContainer();

    const lockedOverlay = globalThis.document.createElement("div");
    lockedOverlay.className = "locked-overlay overlay-list-message";
    lockedOverlay.textContent = "Unlock your account to view matching logins";

    const unlockButtonElement = globalThis.document.createElement("button");
    unlockButtonElement.id = "unlock-button";
    unlockButtonElement.tabIndex = -1;
    unlockButtonElement.className = "unlock-button overlay-list-button";
    unlockButtonElement.textContent = `Unlock account`;
    unlockButtonElement.setAttribute("aria-label", "Unlock account, opens in a new window");
    unlockButtonElement.setAttribute(
      "aria-description",
      "Unlock your account to view matching logins"
    );
    unlockButtonElement.prepend(buildSvgDomElement(lockIcon));
    unlockButtonElement.addEventListener("click", this.handleUnlockButtonClick);

    const overlayListButtonContainer = globalThis.document.createElement("div");
    overlayListButtonContainer.className = "overlay-list-button-container";
    overlayListButtonContainer.appendChild(unlockButtonElement);

    this.overlayListContainer.appendChild(lockedOverlay);
    this.overlayListContainer.appendChild(overlayListButtonContainer);
  }

  private handleUnlockButtonClick = () => {
    this.postMessageToParent({ command: "unlockVault" });
  };

  private updateAutofillOverlayList(message: any) {
    if (!message.ciphers || message.ciphers.length === 0) {
      this.buildNoResultsOverlayList();
      return;
    }

    this.resetOverlayListContainer();

    const ciphersList = globalThis.document.createElement("ul");
    ciphersList.className = "overlay-actions-list";

    message.ciphers.forEach((cipher: any) =>
      ciphersList.appendChild(this.buildOverlayActionsListItem(cipher))
    );

    this.overlayListContainer.appendChild(ciphersList);
  }

  private buildOverlayActionsListItem(cipher: any) {
    const fillCipherElement = this.buildFillCipherElement(cipher);
    const viewCipherElement = this.buildViewCipherElement(cipher);

    const cipherContainerElement = globalThis.document.createElement("div");
    cipherContainerElement.className = "cipher-container";
    cipherContainerElement.appendChild(fillCipherElement);
    cipherContainerElement.appendChild(viewCipherElement);

    const overlayActionsListItem = globalThis.document.createElement("li");
    overlayActionsListItem.className = "overlay-actions-list-item";
    overlayActionsListItem.appendChild(cipherContainerElement);

    return overlayActionsListItem;
  }

  private buildFillCipherElement(cipher: any) {
    const handleFillCipherClick = () =>
      this.postMessageToParent({ command: "autofillSelectedListItem", cipherId: cipher.id });
    const handleFillCipherKeyPress = (event: KeyboardEvent) => {
      event.preventDefault();

      if (event.key === "Enter") {
        handleFillCipherClick();
        return;
      }

      if (!(event.target instanceof Element)) {
        return;
      }

      const parentListItem = event.target.closest(".overlay-actions-list-item") as HTMLElement;

      if (event.key === "ArrowDown") {
        const nextListItem = parentListItem.nextSibling as HTMLElement;
        const nextSibling = nextListItem?.querySelector(".fill-cipher-button") as HTMLElement;
        if (nextSibling) {
          nextSibling.focus();
          return;
        }

        const firstListItem = parentListItem.parentElement?.firstChild as HTMLElement;
        const firstSibling = firstListItem?.querySelector(".fill-cipher-button") as HTMLElement;
        if (firstSibling) {
          firstSibling.focus();
        }
      }

      if (event.key === "ArrowUp") {
        const previousListItem = parentListItem.previousSibling as HTMLElement;
        const previousSibling = previousListItem?.querySelector(
          ".fill-cipher-button"
        ) as HTMLElement;
        if (previousSibling) {
          previousSibling.focus();
          return;
        }

        const lastListItem = parentListItem.parentElement?.lastChild as HTMLElement;
        const lastSibling = lastListItem?.querySelector(".fill-cipher-button") as HTMLElement;
        if (lastSibling) {
          lastSibling.focus();
        }
      }

      if (event.key === "ArrowRight") {
        const cipherContainer = parentListItem.querySelector(".cipher-container") as HTMLElement;
        cipherContainer.classList.add("remove-outline");
        const nextSibling = event.target.nextElementSibling as HTMLElement;
        if (nextSibling) {
          nextSibling.focus();
        }
      }
    };
    const cipherIcon = this.buildCipherIconElement(cipher);
    const cipherDetailsElement = this.buildCipherDetailsElement(cipher);

    const fillCipherElement = globalThis.document.createElement("button");
    fillCipherElement.tabIndex = -1;
    fillCipherElement.className = "fill-cipher-button";
    fillCipherElement.appendChild(cipherIcon);
    fillCipherElement.appendChild(cipherDetailsElement);
    fillCipherElement.addEventListener("click", handleFillCipherClick);
    fillCipherElement.addEventListener("keydown", handleFillCipherKeyPress);

    return fillCipherElement;
  }

  private buildViewCipherElement(cipher: any) {
    const handleViewCipherClick = () =>
      this.postMessageToParent({ command: "viewSelectedCipher", cipherId: cipher.id });

    // TODO: CG - Need to refactor this to remove duplication and also need to add behavior for when we are only Tabbing out of the list.
    const handleViewCipherKeyPress = (event: KeyboardEvent) => {
      event.preventDefault();

      if (event.key === "Enter") {
        handleViewCipherClick();
        return;
      }

      if (event.key === "Tab" && event.shiftKey) {
        this.postMessageToParent({ command: "focusMostRecentInputElement" });
      }

      if (!(event.target instanceof Element)) {
        return;
      }

      const parentListItem = event.target.closest(".overlay-actions-list-item") as HTMLElement;
      const cipherContainer = parentListItem.querySelector(".cipher-container") as HTMLElement;
      if (event.key === "ArrowLeft") {
        cipherContainer.classList.remove("remove-outline");
        const previousSibling = event.target.previousElementSibling as HTMLElement;
        if (previousSibling) {
          previousSibling.focus();
        }
      }

      if (event.key === "ArrowDown") {
        cipherContainer.classList.remove("remove-outline");
        const nextListItem = parentListItem.nextSibling as HTMLElement;
        const nextSibling = nextListItem?.querySelector(".fill-cipher-button") as HTMLElement;
        if (nextSibling) {
          nextSibling.focus();
          return;
        }

        const firstListItem = parentListItem.parentElement?.firstChild as HTMLElement;
        const firstSibling = firstListItem?.querySelector(".fill-cipher-button") as HTMLElement;
        if (firstSibling) {
          firstSibling.focus();
        }
      }

      if (event.key === "ArrowUp") {
        cipherContainer.classList.remove("remove-outline");
        const previousListItem = parentListItem.previousSibling as HTMLElement;
        const previousSibling = previousListItem?.querySelector(
          ".fill-cipher-button"
        ) as HTMLElement;
        if (previousSibling) {
          previousSibling.focus();
          return;
        }

        const lastListItem = parentListItem.parentElement?.lastChild as HTMLElement;
        const lastSibling = lastListItem?.querySelector(".fill-cipher-button") as HTMLElement;
        if (lastSibling) {
          lastSibling.focus();
        }
      }
    };

    const viewCipherElement = globalThis.document.createElement("button");
    viewCipherElement.tabIndex = -1;
    viewCipherElement.className = "view-cipher-button";
    viewCipherElement.append(buildSvgDomElement(viewCipherIcon));
    viewCipherElement.addEventListener("click", handleViewCipherClick);
    viewCipherElement.addEventListener("keydown", handleViewCipherKeyPress);

    return viewCipherElement;
  }

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
      cipherIcon.className = `cipher-icon ${cipher.icon.icon}`;
      return cipherIcon;
    }

    cipherIcon.append(buildSvgDomElement(globeIcon));
    return cipherIcon;
  }

  private buildCipherDetailsElement(cipher: any) {
    const cipherNameElement = this.buildCipherNameElement(cipher);
    const cipherUserLoginElement = this.buildCipherUserLoginElement(cipher);

    const cipherDetailsElement = globalThis.document.createElement("span");
    cipherDetailsElement.className = "cipher-details";
    cipherDetailsElement.appendChild(cipherNameElement);
    cipherDetailsElement.appendChild(cipherUserLoginElement);

    return cipherDetailsElement;
  }

  private buildCipherNameElement(cipher: any) {
    const cipherNameElement = globalThis.document.createElement("span");
    cipherNameElement.className = "cipher-name";
    cipherNameElement.textContent = cipher.name;
    cipherNameElement.setAttribute("title", cipher.name);

    return cipherNameElement;
  }

  private buildCipherUserLoginElement(cipher: any) {
    const cipherUserLoginElement = globalThis.document.createElement("span");
    cipherUserLoginElement.className = "cipher-user-login";
    cipherUserLoginElement.textContent = cipher.login.username;
    cipherUserLoginElement.setAttribute("title", cipher.login.username);

    return cipherUserLoginElement;
  }

  private buildNoResultsOverlayList() {
    this.resetOverlayListContainer();

    const noItemsMessage = globalThis.document.createElement("div");
    noItemsMessage.className = "no-items overlay-list-message";
    noItemsMessage.textContent = "No items to show";

    const newItemButton = globalThis.document.createElement("button");
    newItemButton.tabIndex = -1;
    newItemButton.id = "new-item-button";
    newItemButton.className = "add-new-item-button overlay-list-button";
    newItemButton.textContent = `New item`;
    newItemButton.prepend(buildSvgDomElement(plusIcon));
    newItemButton.addEventListener("click", this.handeNewItemButtonClick);

    const overlayListButtonContainer = globalThis.document.createElement("div");
    overlayListButtonContainer.className = "overlay-list-button-container";
    overlayListButtonContainer.appendChild(newItemButton);

    this.overlayListContainer.appendChild(noItemsMessage);
    this.overlayListContainer.appendChild(overlayListButtonContainer);
  }

  private handeNewItemButtonClick = () => {
    this.postMessageToParent({ command: "addNewVaultItem" });
  };

  private checkOverlayListFocused() {
    if (globalThis.document.hasFocus()) {
      return;
    }

    this.postMessageToParent({ command: "checkOverlayIconFocused" });
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
    if (firstCipherElement) {
      firstCipherElement.focus();
    }
  }

  private redirectOverlayFocusOutMessage(direction: "previous" | "next") {
    this.postMessageToParent({ command: "redirectOverlayFocusOut", direction });
  }

  private postMessageToParent(message: any) {
    if (!this.messageOrigin) {
      return;
    }

    globalThis.parent.postMessage(message, this.messageOrigin);
  }

  private setupGlobalListeners() {
    globalThis.addEventListener("message", this.handleWindowMessage);
    globalThis.document.addEventListener("keydown", this.handleDocumentKeyDownEvent);
    this.resizeObserver = new ResizeObserver(this.handleResizeObserver);
  }

  private handleWindowMessage = (event: MessageEvent) => {
    if (!this.messageOrigin) {
      this.messageOrigin = event.origin;
    }

    const message = event?.data;
    const command = message?.command;
    const handler = this.windowMessageHandlers[command];
    if (!handler) {
      return;
    }

    handler({ message });
  };

  private handleDocumentKeyDownEvent = (event: KeyboardEvent) => {
    const isTabKey = event.key === "Tab";
    if (!isTabKey) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (event.shiftKey) {
      this.redirectOverlayFocusOutMessage("previous");
      return;
    }

    this.redirectOverlayFocusOutMessage("next");
  };

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
}

(function () {
  globalThis.customElements.define(AutofillOverlayCustomElement.List, AutofillOverlayList);
})();

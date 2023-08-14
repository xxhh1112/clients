import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { OverlayListWindowMessageHandlers } from "./abstractions/list";
import { AutofillOverlayCustomElement } from "./utils/autofill-overlay.enum";
import { globeIcon, lockIcon, plusIcon } from "./utils/svg-icons";
import { buildSvgDomElement } from "./utils/utils";

require("./list.scss");

class AutofillOverlayList extends HTMLElement {
  private authStatus: AuthenticationStatus;
  private shadowDom: ShadowRoot;
  private overlayListContainer: HTMLDivElement;
  private globeIconElement: HTMLElement;
  private plusIconElement: HTMLElement;
  private lockIconElement: HTMLElement;
  private styleSheetUrl: string;
  private messageOrigin: string;
  private resizeObserver: ResizeObserver;
  private windowMessageHandlers: OverlayListWindowMessageHandlers = {
    initAutofillOverlayList: ({ message }) => this.initAutofillOverlayList(message),
    checkOverlayListFocused: () => this.checkOverlayListFocused(),
    updateOverlayListCiphers: ({ message }) => this.updateAutofillOverlayList(message),
  };

  constructor() {
    super();

    this.shadowDom = this.attachShadow({ mode: "closed" });
    this.globeIconElement = buildSvgDomElement(globeIcon);
    this.plusIconElement = buildSvgDomElement(plusIcon);
    this.lockIconElement = buildSvgDomElement(lockIcon);
    this.resizeObserver = new ResizeObserver(this.handleResizeObserver);
    this.setupWindowMessageListener();
  }

  private async initAutofillOverlayList(message: any = {}) {
    this.authStatus = message.authStatus;
    this.styleSheetUrl = message.styleSheetUrl;

    this.initShadowDom();

    window.addEventListener("blur", this.handleWindowBlurEvent);
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
    const linkElement = document.createElement("link");
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("href", styleSheetUrl);

    this.overlayListContainer = document.createElement("div");
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

    const lockedOverlay = document.createElement("div");
    lockedOverlay.className = "locked-overlay overlay-list-message";
    lockedOverlay.textContent = "Unlock your account to view matching logins";

    const unlockButton = document.createElement("button");
    unlockButton.className = "unlock-button overlay-list-button";
    unlockButton.textContent = `Unlock account`;
    unlockButton.prepend(this.lockIconElement);

    unlockButton.addEventListener("click", this.handleUnlockButtonClick);

    this.overlayListContainer.appendChild(lockedOverlay);
    this.overlayListContainer.appendChild(unlockButton);
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

    const ciphersList = document.createElement("ul");
    ciphersList.className = "ciphers-list";

    message.ciphers.forEach((cipher: any) =>
      ciphersList.appendChild(this.buildCipherListItemElement(cipher))
    );

    this.overlayListContainer.appendChild(ciphersList);
  }

  private buildCipherListItemElement(cipher: any) {
    const cipherDetailsElement = this.buildCipherDetailsElement(cipher);
    const cipherIcon = this.buildCipherIconElement(cipher);
    const handleCipherClickEvent = () =>
      this.postMessageToParent({ command: "autofillSelectedListItem", cipherId: cipher.id });

    const cipherListItemElement = document.createElement("li");
    cipherListItemElement.className = "cipher";
    cipherListItemElement.addEventListener("click", handleCipherClickEvent);
    cipherListItemElement.appendChild(cipherIcon);
    cipherListItemElement.appendChild(cipherDetailsElement);

    return cipherListItemElement;
  }

  private buildCipherIconElement(cipher: any) {
    const cipherIcon = document.createElement("div");
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

    cipherIcon.append(this.globeIconElement);
    return cipherIcon;
  }

  private buildCipherDetailsElement(cipher: any) {
    const cipherNameElement = this.buildCipherNameElement(cipher);
    const cipherUserLoginElement = this.buildCipherUserLoginElement(cipher);

    const cipherDetailsElement = document.createElement("div");
    cipherDetailsElement.className = "cipher-details";
    cipherDetailsElement.appendChild(cipherNameElement);
    cipherDetailsElement.appendChild(cipherUserLoginElement);

    return cipherDetailsElement;
  }

  private buildCipherNameElement(cipher: any) {
    const cipherNameElement = document.createElement("div");
    cipherNameElement.className = "cipher-name";
    cipherNameElement.textContent = cipher.name;
    cipherNameElement.setAttribute("title", cipher.name);

    return cipherNameElement;
  }

  private buildCipherUserLoginElement(cipher: any) {
    const cipherUserLoginElement = document.createElement("div");
    cipherUserLoginElement.className = "cipher-user-login";
    cipherUserLoginElement.textContent = cipher.login.username;
    cipherUserLoginElement.setAttribute("title", cipher.login.username);

    return cipherUserLoginElement;
  }

  private buildNoResultsOverlayList() {
    this.resetOverlayListContainer();

    const noItemsMessage = document.createElement("div");
    noItemsMessage.className = "no-items overlay-list-message";
    noItemsMessage.textContent = "No items to show";

    const newItemButton = document.createElement("button");
    newItemButton.className = "add-new-item-button overlay-list-button";
    newItemButton.textContent = `New item`;
    newItemButton.prepend(this.plusIconElement);

    newItemButton.addEventListener("click", this.handeNewItemButtonClick);

    this.overlayListContainer.appendChild(noItemsMessage);
    this.overlayListContainer.appendChild(newItemButton);
  }

  private handeNewItemButtonClick = () => {
    this.postMessageToParent({ command: "addNewVaultItem" });
  };

  private checkOverlayListFocused() {
    if (document.hasFocus()) {
      return;
    }

    this.postMessageToParent({ command: "checkOverlayIconFocused" });
  }

  private postMessageToParent(message: any) {
    if (!this.messageOrigin) {
      return;
    }

    window.parent.postMessage(message, this.messageOrigin);
  }

  private setupWindowMessageListener() {
    window.addEventListener("message", this.handleWindowMessage);
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
  window.customElements.define(AutofillOverlayCustomElement.List, AutofillOverlayList);
})();

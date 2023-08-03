import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { OverlayListPortMessageHandlers } from "./abstractions/list";
import AutofillOverlayPort from "./utils/port-identifiers.enum";
import { globeIcon, lockIcon } from "./utils/svg-icons";

require("./list.scss");

class AutofillOverlayList extends HTMLElement {
  private authStatus: AuthenticationStatus;
  private shadowDom: ShadowRoot;
  private port: chrome.runtime.Port;
  private portMessageHandlers: OverlayListPortMessageHandlers = {
    initAutofillOverlayList: ({ message }) => this.initAutofillOverlayList(message),
    checkOverlayFocused: () => this.checkOverlayFocused(),
  };

  constructor() {
    super();

    this.shadowDom = this.attachShadow({ mode: "closed" });
    this.setupPortMessageListener();
  }

  private async initAutofillOverlayList(message: any = {}) {
    this.authStatus = message.authStatus;
    this.updateAutofillOverlayList(message);

    this.resetShadowDOM();

    window.addEventListener("blur", () => {
      chrome.runtime.sendMessage({
        command: "bgCloseOverlay",
      });
    });

    if (this.authStatus === AuthenticationStatus.Unlocked) {
      this.updateAutofillOverlayList(message);
      return;
    }

    this.buildLockedOverlay();
  }

  private resetShadowDOM() {
    this.shadowDom.innerHTML = "";
    const styleSheetUrl = chrome.runtime.getURL("overlay/list.css");
    const linkElement = document.createElement("link");
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("href", styleSheetUrl);
    this.shadowDom.appendChild(linkElement);
  }

  private buildLockedOverlay() {
    this.resetShadowDOM();

    const lockedOverlay = document.createElement("div");
    lockedOverlay.className = "locked-overlay";
    lockedOverlay.textContent = "Unlock your account to view matching logins";

    const unlockButton = document.createElement("button");
    unlockButton.className = "unlock-button";
    unlockButton.innerHTML = `${lockIcon} Unlock account`;

    unlockButton.addEventListener("click", () => {
      chrome.runtime.sendMessage({
        command: "bgOverlayUnlockVault",
      });
    });

    this.shadowDom.appendChild(lockedOverlay);
    this.shadowDom.appendChild(unlockButton);
  }

  private updateAutofillOverlayList(message: any) {
    this.resetShadowDOM();

    message.ciphers.forEach((cipher: any) => {
      const cipherElement = document.createElement("div");
      cipherElement.className = "cipher";

      const cipherIcon = document.createElement("div");
      cipherIcon.innerHTML = globeIcon;
      const globeIconElement = cipherIcon.querySelector("svg");
      globeIconElement.classList.add("globe-icon");

      const cipherDetailsContainer = document.createElement("div");
      cipherDetailsContainer.className = "cipher-details-container";

      const cipherNameElement = document.createElement("div");
      cipherNameElement.className = "cipher-name";
      cipherNameElement.textContent = cipher.name;

      const cipherUserLoginElement = document.createElement("div");
      cipherUserLoginElement.className = "cipher-user-login";
      cipherUserLoginElement.textContent = cipher.login.username;

      cipherDetailsContainer.appendChild(cipherNameElement);
      cipherDetailsContainer.appendChild(cipherUserLoginElement);

      cipherElement.appendChild(globeIconElement);
      cipherElement.appendChild(cipherDetailsContainer);

      this.shadowDom.appendChild(cipherElement);

      cipherElement.addEventListener("click", () => {
        chrome.runtime.sendMessage({
          command: "bgAutofillOverlayListItem",
          cipherId: cipher.id,
        });
      });
    });
  }

  private checkOverlayFocused() {
    if (document.hasFocus()) {
      return true;
    }

    chrome.runtime.sendMessage({
      command: "bgCloseOverlay",
    });
    return false;
  }

  private setupPortMessageListener() {
    this.port = chrome.runtime.connect({ name: AutofillOverlayPort.List });
    this.port.onMessage.addListener(this.handlePortMessage);
  }

  private handlePortMessage = (message: any, port: chrome.runtime.Port) => {
    if (port.name !== AutofillOverlayPort.List) {
      return;
    }

    const handler = this.portMessageHandlers[message?.command];
    if (!handler) {
      return;
    }

    handler({ message, port });
  };
}

(function () {
  window.customElements.define("autofill-overlay-list", AutofillOverlayList);
})();

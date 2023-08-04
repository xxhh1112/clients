import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { OverlayListWindowMessageHandlers } from "./abstractions/list";
import { globeIcon, lockIcon } from "./utils/svg-icons";

require("./list.scss");

class AutofillOverlayList extends HTMLElement {
  private authStatus: AuthenticationStatus;
  private shadowDom: ShadowRoot;
  private styleSheetUrl: string;
  private messageOrigin: string;
  private windowMessageHandlers: OverlayListWindowMessageHandlers = {
    initAutofillOverlayList: ({ message }) => this.initAutofillOverlayList(message),
    checkOverlayListFocused: () => this.checkOverlayListFocused(),
  };

  constructor() {
    super();

    this.shadowDom = this.attachShadow({ mode: "closed" });
    this.setupWindowMessageListener();
  }

  private async initAutofillOverlayList(message: any = {}) {
    this.authStatus = message.authStatus;
    this.styleSheetUrl = message.styleSheetUrl;
    this.updateAutofillOverlayList(message);

    this.resetShadowDOM();

    window.addEventListener("blur", () =>
      this.postMessageToParent({ command: "overlayListBlurred" })
    );
    if (this.authStatus === AuthenticationStatus.Unlocked) {
      this.updateAutofillOverlayList(message);
      return;
    }

    this.buildLockedOverlay();
  }

  private resetShadowDOM() {
    this.shadowDom.innerHTML = "";
    const styleSheetUrl = this.styleSheetUrl;
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

    unlockButton.addEventListener("click", () =>
      this.postMessageToParent({ command: "unlockVault" })
    );

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

      cipherElement.addEventListener("click", () =>
        this.postMessageToParent({ command: "autofillSelectedListItem", cipherId: cipher.id })
      );
    });
  }

  private checkOverlayListFocused() {
    if (document.hasFocus()) {
      return;
    }

    this.postMessageToParent({ command: "closeAutofillOverlay" });
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
}

(function () {
  window.customElements.define("autofill-overlay-list", AutofillOverlayList);
})();

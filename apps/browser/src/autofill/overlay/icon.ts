import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { OverlayIconPortMessageHandlers } from "./abstractions/icon";
import AutofillOverlayPort from "./utils/port-identifiers.enum";
import { logoIcon, logoLockedIcon } from "./utils/svg-icons";

require("./icon.scss");

class AutofillOverlayIcon extends HTMLElement {
  private authStatus: AuthenticationStatus = AuthenticationStatus.LoggedOut;
  private shadowDom: ShadowRoot;
  private iconElement: HTMLElement;
  private port: chrome.runtime.Port;
  private readonly portMessageHandlers: OverlayIconPortMessageHandlers = {
    initAutofillOverlayIcon: ({ message }) => this.initAutofillOverlayIcon(message),
  };

  constructor() {
    super();

    this.shadowDom = this.attachShadow({ mode: "closed" });
    this.setupPortMessageListener();
  }

  private updateAuthStatus(status?: AuthenticationStatus) {
    if (!status) {
      return;
    }

    this.authStatus = status;
  }

  private isVaultUnlocked(): boolean {
    return this.authStatus === AuthenticationStatus.Unlocked;
  }

  private async initAutofillOverlayIcon(message: any = {}) {
    this.authStatus = message.authStatus;

    this.iconElement = document.createElement(this.isVaultUnlocked() ? "button" : "div");
    this.iconElement.innerHTML = this.isVaultUnlocked() ? logoIcon : logoLockedIcon;
    this.iconElement.classList.add("overlay-icon");

    const styleSheetUrl = chrome.runtime.getURL("overlay/icon.css");
    const linkElement = document.createElement("link");
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("href", styleSheetUrl);

    if (this.isVaultUnlocked()) {
      this.iconElement.addEventListener("click", () => {
        chrome.runtime.sendMessage({ command: "bgOpenAutofillOverlayList" });
      });
    }

    this.shadowDom.appendChild(linkElement);
    this.shadowDom.appendChild(this.iconElement);
  }

  private setupPortMessageListener() {
    this.port = chrome.runtime.connect({ name: AutofillOverlayPort.Icon });
    this.port.onMessage.addListener(this.handlePortMessage);
  }

  private handlePortMessage = (message: any, port: chrome.runtime.Port) => {
    if (port.name !== AutofillOverlayPort.Icon) {
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
  window.customElements.define("autofill-overlay-icon", AutofillOverlayIcon);
})();

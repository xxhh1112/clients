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
    checkOverlayIconFocused: () => this.checkOverlayIconFocused(),
  };

  constructor() {
    super();

    this.shadowDom = this.attachShadow({ mode: "closed" });
    this.setupPortMessageListener();
  }

  private isVaultUnlocked(): boolean {
    return this.authStatus === AuthenticationStatus.Unlocked;
  }

  private async initAutofillOverlayIcon(message: any = {}) {
    this.authStatus = message.authStatus;

    window.addEventListener("blur", () => this.port.postMessage({ command: "overlayIconBlurred" }));

    this.iconElement = document.createElement(this.isVaultUnlocked() ? "button" : "div");
    this.iconElement.innerHTML = this.isVaultUnlocked() ? logoIcon : logoLockedIcon;
    this.iconElement.classList.add("overlay-icon");

    const styleSheetUrl = chrome.runtime.getURL("overlay/icon.css");
    const linkElement = document.createElement("link");
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("href", styleSheetUrl);

    this.iconElement.addEventListener("click", this.handleIconClick);

    this.shadowDom.appendChild(linkElement);
    this.shadowDom.appendChild(this.iconElement);
  }

  private handleIconClick = () => {
    if (!this.port) {
      return;
    }

    this.port.postMessage({ command: "overlayIconClicked" });
  };

  private checkOverlayIconFocused() {
    if (document.hasFocus()) {
      return;
    }

    this.port.postMessage({ command: "closeAutofillOverlay" });
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

import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { OverlayIconWindowMessageHandlers } from "./abstractions/icon";
import { logoIcon, logoLockedIcon } from "./utils/svg-icons";

require("./icon.scss");

class AutofillOverlayIcon extends HTMLElement {
  private authStatus: AuthenticationStatus = AuthenticationStatus.LoggedOut;
  private shadowDom: ShadowRoot;
  private iconElement: HTMLElement;
  private messageOrigin: string;
  private readonly windowMessageHandlers: OverlayIconWindowMessageHandlers = {
    initAutofillOverlayIcon: ({ message }) => this.initAutofillOverlayIcon(message),
    checkOverlayIconFocused: () => this.checkOverlayIconFocused(),
    updateAuthStatus: ({ message }) => this.updateAuthStatus(message),
  };

  constructor() {
    super();

    this.shadowDom = this.attachShadow({ mode: "closed" });
    this.setupWindowMessageListener();
  }

  private isVaultUnlocked(): boolean {
    return this.authStatus === AuthenticationStatus.Unlocked;
  }

  private async initAutofillOverlayIcon(message: any = {}) {
    this.authStatus = message.authStatus;

    window.addEventListener("blur", () =>
      this.postMessageToParent({ command: "overlayIconBlurred" })
    );

    this.iconElement = document.createElement("button");
    this.iconElement.innerHTML = this.isVaultUnlocked() ? logoIcon : logoLockedIcon;
    this.iconElement.classList.add("overlay-icon");

    const styleSheetUrl = message.styleSheetUrl;
    const linkElement = document.createElement("link");
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("href", styleSheetUrl);

    this.iconElement.addEventListener("click", this.handleIconClick);

    this.shadowDom.appendChild(linkElement);
    this.shadowDom.appendChild(this.iconElement);
  }

  private updateAuthStatus(message: any = {}) {
    this.authStatus = message.authStatus;
    this.iconElement.innerHTML = this.isVaultUnlocked() ? logoIcon : logoLockedIcon;
  }

  private handleIconClick = () => {
    this.postMessageToParent({ command: "overlayIconClicked" });
  };

  private checkOverlayIconFocused() {
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
  window.customElements.define("autofill-overlay-icon", AutofillOverlayIcon);
})();

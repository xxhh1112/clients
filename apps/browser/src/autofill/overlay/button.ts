import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { OverlayButtonWindowMessageHandlers } from "./abstractions/button";
import { AutofillOverlayCustomElement } from "./utils/autofill-overlay.enum";
import { logoIcon, logoLockedIcon } from "./utils/svg-icons";
import { buildSvgDomElement } from "./utils/utils";

require("./button.scss");

class AutofillOverlayButton extends HTMLElement {
  private authStatus: AuthenticationStatus = AuthenticationStatus.LoggedOut;
  private shadowDom: ShadowRoot;
  private buttonElement: HTMLElement;
  private messageOrigin: string;
  private readonly logoIconElement: HTMLElement;
  private readonly logoLockedIconElement: HTMLElement;
  private readonly windowMessageHandlers: OverlayButtonWindowMessageHandlers = {
    initAutofillOverlayButton: ({ message }) =>
      this.initAutofillOverlayButton(message.authStatus, message.styleSheetUrl),
    checkOverlayButtonFocused: () => this.checkOverlayButtonFocused(),
    updateAuthStatus: ({ message }) => this.updateAuthStatus(message.authStatus),
  };

  constructor() {
    super();

    this.setupWindowMessageListener();
    this.shadowDom = this.attachShadow({ mode: "closed" });
    this.logoIconElement = buildSvgDomElement(logoIcon);
    this.logoLockedIconElement = buildSvgDomElement(logoLockedIcon);
  }

  private async initAutofillOverlayButton(authStatus: AuthenticationStatus, styleSheetUrl: string) {
    const linkElement = globalThis.document.createElement("link");
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("href", styleSheetUrl);

    this.buttonElement = globalThis.document.createElement("button");
    this.buttonElement.tabIndex = -1;
    this.buttonElement.classList.add("overlay-button");
    this.buttonElement.addEventListener("click", this.handleButtonElementClick);

    this.updateAuthStatus(authStatus);

    this.shadowDom.append(linkElement, this.buttonElement);
  }

  private updateAuthStatus(authStatus: AuthenticationStatus) {
    this.authStatus = authStatus;
    this.setIconElementSvg();
  }

  private setIconElementSvg() {
    if (!this.buttonElement) {
      return;
    }

    this.buttonElement.innerHTML = "";

    const iconElement =
      this.authStatus === AuthenticationStatus.Unlocked
        ? this.logoIconElement
        : this.logoLockedIconElement;
    this.buttonElement.append(iconElement);
  }

  private handleButtonElementClick = () => {
    this.postMessageToParent({ command: "overlayButtonClicked" });
  };

  private checkOverlayButtonFocused() {
    if (globalThis.document.hasFocus()) {
      return;
    }

    this.postMessageToParent({ command: "closeAutofillOverlay" });
  }

  private postMessageToParent(message: any) {
    if (!this.messageOrigin) {
      return;
    }

    globalThis.parent.postMessage(message, this.messageOrigin);
  }

  private setupWindowMessageListener() {
    globalThis.addEventListener("message", this.handleWindowMessage);
    globalThis.addEventListener("blur", this.handleWindowBlurEvent);
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

  private handleWindowBlurEvent = () => {
    this.postMessageToParent({ command: "overlayButtonBlurred" });
  };
}

(function () {
  globalThis.customElements.define(AutofillOverlayCustomElement.Button, AutofillOverlayButton);
})();

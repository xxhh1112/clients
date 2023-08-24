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
    initAutofillOverlayButton: ({ message }) => this.initAutofillOverlayButton(message),
    checkOverlayButtonFocused: () => this.checkOverlayButtonFocused(),
    updateAuthStatus: ({ message }) => this.updateAuthStatus(message),
  };

  constructor() {
    super();

    this.shadowDom = this.attachShadow({ mode: "closed" });
    this.logoIconElement = buildSvgDomElement(logoIcon);
    this.logoLockedIconElement = buildSvgDomElement(logoLockedIcon);
    this.setupWindowMessageListener();
  }

  private isVaultUnlocked(): boolean {
    return this.authStatus === AuthenticationStatus.Unlocked;
  }

  private async initAutofillOverlayButton(message: any = {}) {
    this.authStatus = message.authStatus;

    globalThis.addEventListener("blur", this.handleWindowBlurEvent);

    this.buttonElement = globalThis.document.createElement("button");
    this.buttonElement.tabIndex = -1;
    this.buttonElement.classList.add("overlay-button");
    this.buttonElement.addEventListener("click", this.handleButtonElementClick);
    this.setIconElementSvg();

    const styleSheetUrl = message.styleSheetUrl;
    const linkElement = globalThis.document.createElement("link");
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("href", styleSheetUrl);

    this.shadowDom.appendChild(linkElement);
    this.shadowDom.appendChild(this.buttonElement);
  }

  private getLogoIconElement(): HTMLElement {
    return this.isVaultUnlocked() ? this.logoIconElement : this.logoLockedIconElement;
  }

  private handleWindowBlurEvent = () => {
    this.postMessageToParent({ command: "overlayButtonBlurred" });
  };

  private updateAuthStatus(message: any = {}) {
    this.authStatus = message.authStatus;
    this.setIconElementSvg();
  }

  private setIconElementSvg() {
    if (!this.buttonElement) {
      return;
    }

    this.buttonElement.innerHTML = "";
    this.buttonElement.append(this.getLogoIconElement());
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
  globalThis.customElements.define(AutofillOverlayCustomElement.Button, AutofillOverlayButton);
})();

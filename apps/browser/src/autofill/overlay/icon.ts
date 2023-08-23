import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { OverlayIconWindowMessageHandlers } from "./abstractions/icon";
import { AutofillOverlayCustomElement } from "./utils/autofill-overlay.enum";
import { logoIcon, logoLockedIcon } from "./utils/svg-icons";
import { buildSvgDomElement } from "./utils/utils";

require("./icon.scss");

class AutofillOverlayIcon extends HTMLElement {
  private authStatus: AuthenticationStatus = AuthenticationStatus.LoggedOut;
  private shadowDom: ShadowRoot;
  private iconElement: HTMLElement;
  private messageOrigin: string;
  private readonly logoIconElement: HTMLElement;
  private readonly logoLockedIconElement: HTMLElement;
  private readonly windowMessageHandlers: OverlayIconWindowMessageHandlers = {
    initAutofillOverlayIcon: ({ message }) => this.initAutofillOverlayIcon(message),
    checkOverlayIconFocused: () => this.checkOverlayIconFocused(),
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

  private async initAutofillOverlayIcon(message: any = {}) {
    this.authStatus = message.authStatus;

    globalThis.addEventListener("blur", this.handleWindowBlurEvent);

    this.iconElement = globalThis.document.createElement("button");
    this.iconElement.tabIndex = -1;
    this.iconElement.classList.add("overlay-icon");
    this.iconElement.addEventListener("click", this.handleIconClick);
    this.setIconElementSvg();

    const styleSheetUrl = message.styleSheetUrl;
    const linkElement = globalThis.document.createElement("link");
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("href", styleSheetUrl);

    this.shadowDom.appendChild(linkElement);
    this.shadowDom.appendChild(this.iconElement);
  }

  private getLogoIconElement(): HTMLElement {
    return this.isVaultUnlocked() ? this.logoIconElement : this.logoLockedIconElement;
  }

  private handleWindowBlurEvent = () => {
    this.postMessageToParent({ command: "overlayIconBlurred" });
  };

  private updateAuthStatus(message: any = {}) {
    this.authStatus = message.authStatus;
    this.setIconElementSvg();
  }

  private setIconElementSvg() {
    if (!this.iconElement) {
      return;
    }

    this.iconElement.innerHTML = "";
    this.iconElement.append(this.getLogoIconElement());
  }

  private handleIconClick = () => {
    this.postMessageToParent({ command: "overlayIconClicked" });
  };

  private checkOverlayIconFocused() {
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
  globalThis.customElements.define(AutofillOverlayCustomElement.Icon, AutofillOverlayIcon);
})();

import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { EVENTS } from "../../../constants";
import { AutofillOverlayElement } from "../../../utils/autofill-overlay.enum";
import { logoIcon, logoLockedIcon } from "../../../utils/svg-icons";
import { buildSvgDomElement } from "../../../utils/utils";
import { OverlayButtonWindowMessageHandlers } from "../../abstractions/button";

require("./button.scss");

class AutofillOverlayButton extends HTMLElement {
  private authStatus: AuthenticationStatus = AuthenticationStatus.LoggedOut;
  private shadowDom: ShadowRoot;
  private buttonElement: HTMLButtonElement;
  private messageOrigin: string;
  private translations: Record<string, string>;
  private readonly logoIconElement: HTMLElement;
  private readonly logoLockedIconElement: HTMLElement;
  private readonly windowMessageHandlers: OverlayButtonWindowMessageHandlers = {
    initAutofillOverlayButton: ({ message }) =>
      this.init(message.authStatus, message.styleSheetUrl, message.translations),
    checkAutofillOverlayButtonFocused: () => this.checkButtonFocused(),
    updateAutofillOverlayButtonAuthStatus: ({ message }) =>
      this.updateAuthStatus(message.authStatus),
  };

  constructor() {
    super();

    this.setupWindowMessageListener();
    this.shadowDom = this.attachShadow({ mode: "closed" });

    this.logoIconElement = buildSvgDomElement(logoIcon);
    this.logoIconElement.classList.add("overlay-button-svg-icon", "logo-icon");

    this.logoLockedIconElement = buildSvgDomElement(logoLockedIcon);
    this.logoLockedIconElement.classList.add("overlay-button-svg-icon", "logo-locked-icon");
  }

  private async init(
    authStatus: AuthenticationStatus,
    styleSheetUrl: string,
    translations: Record<string, string>
  ) {
    this.translations = translations;
    globalThis.document.documentElement.setAttribute("lang", this.getTranslation("locale"));
    globalThis.document.head.title = this.getTranslation("buttonPageTitle");

    const linkElement = globalThis.document.createElement("link");
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("href", styleSheetUrl);

    this.buttonElement = globalThis.document.createElement("button");
    this.buttonElement.tabIndex = -1;
    this.buttonElement.type = "button";
    this.buttonElement.classList.add("overlay-button");
    this.buttonElement.setAttribute(
      "aria-label",
      this.getTranslation("toggleBitwardenVaultOverlay")
    );
    this.buttonElement.addEventListener(EVENTS.CLICK, this.handleButtonElementClick);

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

  private checkButtonFocused() {
    if (globalThis.document.hasFocus()) {
      return;
    }

    this.postMessageToParent({ command: "closeAutofillOverlay" });
  }

  private getTranslation(key: string): string {
    return this.translations[key] || "";
  }

  private postMessageToParent(message: { command: string }) {
    if (!this.messageOrigin) {
      return;
    }

    globalThis.parent.postMessage(message, this.messageOrigin);
  }

  private setupWindowMessageListener() {
    globalThis.addEventListener(EVENTS.MESSAGE, this.handleWindowMessage);
    globalThis.addEventListener(EVENTS.BLUR, this.handleWindowBlurEvent);
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
  globalThis.customElements.define(AutofillOverlayElement.Button, AutofillOverlayButton);
})();

import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { EVENTS } from "../../../constants";
import { AutofillOverlayElement } from "../../../utils/autofill-overlay.enum";
import { logoIcon, logoLockedIcon } from "../../../utils/svg-icons";
import { buildSvgDomElement } from "../../../utils/utils";
import {
  InitAutofillOverlayButtonMessage,
  OverlayButtonWindowMessageHandlers,
} from "../../abstractions/button";
import AutofillOverlayPage from "../shared/autofill-overlay-page";

require("./button.scss");

class AutofillOverlayButton extends AutofillOverlayPage {
  private authStatus: AuthenticationStatus = AuthenticationStatus.LoggedOut;
  private buttonElement: HTMLButtonElement;
  private readonly logoIconElement: HTMLElement;
  private readonly logoLockedIconElement: HTMLElement;
  private readonly overlayButtonWindowMessageHandlers: OverlayButtonWindowMessageHandlers = {
    initAutofillOverlayButton: ({ message }) => this.initAutofillOverlayButton(message),
    checkAutofillOverlayButtonFocused: () => this.checkButtonFocused(),
    updateAutofillOverlayButtonAuthStatus: ({ message }) =>
      this.updateAuthStatus(message.authStatus),
  };

  constructor() {
    super();

    this.setupGlobalListeners(this.overlayButtonWindowMessageHandlers);

    this.logoIconElement = buildSvgDomElement(logoIcon);
    this.logoIconElement.classList.add("overlay-button-svg-icon", "logo-icon");

    this.logoLockedIconElement = buildSvgDomElement(logoLockedIcon);
    this.logoLockedIconElement.classList.add("overlay-button-svg-icon", "logo-locked-icon");
  }

  private async initAutofillOverlayButton({
    authStatus,
    styleSheetUrl,
    translations,
  }: InitAutofillOverlayButtonMessage) {
    const linkElement = this.initOverlayPage("button", styleSheetUrl, translations);

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
}

(function () {
  globalThis.customElements.define(AutofillOverlayElement.Button, AutofillOverlayButton);
})();

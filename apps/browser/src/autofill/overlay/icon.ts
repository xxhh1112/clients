import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { logoIcon, logoLockedIcon } from "./utils/svg-icons";
import { getAuthStatusFromQueryParam } from "./utils/utils";

require("./icon.scss");

(function () {
  class AutofillOverlayIcon extends HTMLElement {
    private readonly authStatus: number;
    private shadowDom: ShadowRoot;
    private iconElement: HTMLElement;

    constructor() {
      super();

      this.authStatus = getAuthStatusFromQueryParam();
      this.initAutofillOverlayIcon();
    }

    private isVaultUnlocked(): boolean {
      return this.authStatus === AuthenticationStatus.Unlocked;
    }

    private initAutofillOverlayIcon() {
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

      this.shadowDom = this.attachShadow({ mode: "closed" });
      this.shadowDom.appendChild(linkElement);
      this.shadowDom.appendChild(this.iconElement);
    }
  }

  window.customElements.define("autofill-overlay-icon", AutofillOverlayIcon);
})();

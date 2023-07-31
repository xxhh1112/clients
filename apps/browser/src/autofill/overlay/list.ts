import "@webcomponents/custom-elements";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { OverlayListExtensionMessageHandlers } from "./abstractions/list";
import { globeIcon, lockIcon } from "./utils/svg-icons";
import { getAuthStatusFromQueryParam } from "./utils/utils";

require("./list.scss");

(function () {
  class AutofillOverlayList extends HTMLElement {
    private readonly authStatus: AuthenticationStatus;
    private shadowDom: ShadowRoot;
    private extensionMessageHandlers: OverlayListExtensionMessageHandlers = {
      updateAutofillOverlayList: ({ message }) => this.updateAutofillOverlayList(message),
      checkOverlayFocused: () => this.checkOverlayFocused(),
    };

    constructor() {
      super();

      this.authStatus = getAuthStatusFromQueryParam();
      this.setupExtensionMessageListeners();
      this.initAutofillOverlayList();
    }

    private initAutofillOverlayList() {
      chrome.runtime.sendMessage({ command: "bgUpdateAutofillOverlayListSender" });

      this.shadowDom = this.attachShadow({ mode: "closed" });
      this.resetShadowDOM();

      window.addEventListener("blur", () => {
        chrome.runtime.sendMessage({
          command: "bgCloseOverlay",
        });
      });

      if (this.authStatus === AuthenticationStatus.Unlocked) {
        chrome.runtime.sendMessage({
          command: "bgGetAutofillOverlayList",
        });
        return;
      }

      this.buildLockedOverlay();
    }

    private resetShadowDOM() {
      this.shadowDom.innerHTML = "";
      const styleSheetUrl = chrome.runtime.getURL("overlay/list.css");
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

      unlockButton.addEventListener("click", () => {
        chrome.runtime.sendMessage({
          command: "bgOverlayUnlockVault",
        });
      });

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

        cipherElement.addEventListener("click", () => {
          chrome.runtime.sendMessage({
            command: "bgAutofillOverlayListItem",
            cipherId: cipher.id,
          });
        });
      });
    }

    private checkOverlayFocused() {
      if (document.hasFocus()) {
        return true;
      }

      chrome.runtime.sendMessage({
        command: "bgCloseOverlay",
      });
      return false;
    }

    private setupExtensionMessageListeners() {
      chrome.runtime.onMessage.addListener(this.handleExtensionMessage);
    }

    private handleExtensionMessage = (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ): boolean => {
      const command: string = message.command;
      const handler: CallableFunction | undefined = this.extensionMessageHandlers[command];
      if (!handler) {
        return false;
      }

      const messageResponse = handler({ message, sender });
      if (!messageResponse) {
        return false;
      }

      Promise.resolve(messageResponse).then((response) => sendResponse(response));
      return true;
    };
  }

  window.customElements.define("autofill-overlay-list", AutofillOverlayList);
})();

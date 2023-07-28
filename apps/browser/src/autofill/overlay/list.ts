import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { OverlayListExtensionMessageHandlers } from "./abstractions/list";
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
      this.shadowDom = this.attachShadow({ mode: "closed" });
      chrome.runtime.sendMessage({
        command: "bgGetAutofillOverlayList",
      });

      window.addEventListener("blur", () => {
        chrome.runtime.sendMessage({
          command: "bgCloseOverlay",
        });
      });
    }

    private updateAutofillOverlayList(message: any) {
      this.shadowDom.innerHTML = "";
      message.ciphers.forEach((cipher: any) => {
        const cipherElement = document.createElement("div");
        cipherElement.className = "cipher";
        cipherElement.innerHTML = cipher.name;
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
        return;
      }

      chrome.runtime.sendMessage({
        command: "bgCloseOverlay",
      });
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

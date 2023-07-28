import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { getAuthStatusFromQueryParam } from "./utils";

require("./list.scss");

(function () {
  class AutofillOverlayList extends HTMLElement {
    private readonly authStatus: AuthenticationStatus;
    private shadowDom: ShadowRoot;

    constructor() {
      super();

      this.authStatus = getAuthStatusFromQueryParam();

      chrome.runtime.onMessage.addListener((message) => {
        if (message.command === "updateAutofillOverlayList") {
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
        } else if (message.command === "checkOverlayFocused") {
          if (!document.hasFocus()) {
            chrome.runtime.sendMessage({
              command: "bgCloseOverlay",
            });
          }
        }
      });

      this.initAutofillOverlayList();
    }

    initAutofillOverlayList() {
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
  }

  window.customElements.define("autofill-overlay-list", AutofillOverlayList);
})();

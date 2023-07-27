require("./list.scss");

(function () {
  class AutofillOverlayList extends HTMLElement {
    private shadowDom: ShadowRoot;

    constructor() {
      super();

      this.shadowDom = this.attachShadow({ mode: "closed" });

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

      chrome.runtime.sendMessage({
        command: "bgGetAutofillOverlayList",
      });
    }
  }

  window.customElements.define("autofill-overlay-list", AutofillOverlayList);
})();

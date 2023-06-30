require("./list.scss");

class AutofillOverlayList extends HTMLElement {
  private shadowDom: ShadowRoot;

  constructor() {
    super();

    this.shadowDom = this.attachShadow({ mode: "closed" });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.command !== "updateAutofillOverlayList") {
        return;
      }
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
    });

    chrome.runtime.sendMessage({
      command: "bgGetAutofillOverlayList",
    });
  }
}

(function () {
  window.customElements.define("autofill-overlay-list", AutofillOverlayList);
})();

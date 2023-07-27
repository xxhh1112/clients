require("./button.scss");

(function () {
  class AutofillOverlayButton extends HTMLElement {
    private shadowDom: ShadowRoot;
    private buttonElement: HTMLButtonElement;
    private logoSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none"><path fill="#175DDC" d="M12.66.175A.566.566 0 0 0 12.25 0H1.75a.559.559 0 0 0-.409.175.561.561 0 0 0-.175.41v7c.002.532.105 1.06.305 1.554.189.488.444.948.756 1.368.322.42.682.81 1.076 1.163.365.335.75.649 1.152.939.35.248.718.483 1.103.706.385.222.656.372.815.45.16.08.29.141.386.182A.53.53 0 0 0 7 14a.509.509 0 0 0 .238-.055c.098-.043.225-.104.387-.182.162-.079.438-.23.816-.45.378-.222.75-.459 1.102-.707.403-.29.788-.604 1.154-.939a8.435 8.435 0 0 0 1.076-1.163c.312-.42.567-.88.757-1.367a4.19 4.19 0 0 0 .304-1.555v-7a.55.55 0 0 0-.174-.407Z"/><path fill="#fff" d="M7 12.365s4.306-2.18 4.306-4.717V1.5H7v10.865Z"/></svg>';

    constructor() {
      super();

      this.shadowDom = this.attachShadow({ mode: "closed" });

      this.buttonElement = document.createElement("button");
      this.buttonElement.innerHTML = this.logoSvg;
      this.buttonElement.classList.add("overlay-button");

      const linkElement = document.createElement("link");
      linkElement.setAttribute("rel", "stylesheet");
      linkElement.setAttribute("href", chrome.runtime.getURL("overlay/button.css"));
      this.shadowDom.appendChild(linkElement);
      this.shadowDom.appendChild(this.buttonElement);

      // this.buttonElement.addEventListener("click", () => {
      //   chrome?.runtime?.sendMessage({ command: "bgOpenAutofillOverlayList" });
      // });
    }
  }

  window.customElements.define("autofill-overlay-button", AutofillOverlayButton);
})();

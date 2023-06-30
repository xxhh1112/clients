require("./button.scss");

class AutofillOverlayButton extends HTMLElement {
  private shadowDom: ShadowRoot;
  private buttonElement: HTMLButtonElement;
  private logoSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="68" height="68" viewBox="0 0 68 68" fill="none"><path fill="#fff" d="M52.232 15.13c-.369-.37-.807-.559-1.305-.559H17.405c-.508 0-.936.19-1.304.558-.369.369-.558.797-.558 1.305v22.348c0 1.663.329 3.326.976 4.96.647 1.642 1.454 3.096 2.42 4.361.956 1.275 2.101 2.51 3.436 3.705 1.324 1.205 2.56 2.2 3.684 2.998 1.126.796 2.301 1.543 3.526 2.25 1.225.707 2.091 1.185 2.61 1.444.517.25.925.448 1.234.578.23.12.488.18.757.18s.528-.06.757-.18c.309-.14.727-.329 1.235-.578.518-.249 1.384-.737 2.609-1.444a48.294 48.294 0 0 0 3.526-2.25c1.125-.797 2.35-1.793 3.684-2.998 1.325-1.205 2.47-2.44 3.436-3.705.956-1.275 1.763-2.729 2.41-4.362.647-1.643.976-3.296.976-4.96V16.435a1.934 1.934 0 0 0-.587-1.305Zm-4.323 23.86c0 8.087-13.743 15.059-13.743 15.059V19.352H47.91V38.99Z"/></svg>';

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

    this.buttonElement.addEventListener("click", () => {
      chrome?.runtime?.sendMessage({ command: "bgOpenAutofillOverlayList" });
    });
  }
}

(function () {
  window.customElements.define("autofill-overlay-button", AutofillOverlayButton);
})();

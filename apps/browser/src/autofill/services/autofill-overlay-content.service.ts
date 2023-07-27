import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";

import AutofillField from "../models/autofill-field";
import { ElementWithOpId, FormFieldElement } from "../types";

import { AutofillOverlayContentService as AutofillOverlayContentServiceInterface } from "./abstractions/autofill-overlay-content.service";

class AutofillOverlayContentService implements AutofillOverlayContentServiceInterface {
  private overlayIconElement: HTMLElement;
  private overlayListElement: HTMLElement;
  private mostRecentlyFocusedFieldRects: DOMRect;

  constructor() {
    window.addEventListener("scroll", () => {
      this.removeOverlay();
    });
    window.addEventListener("resize", () => {
      this.removeOverlay();
    });
    document.body?.addEventListener("scroll", () => {
      this.removeOverlay();
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.command === "fillForm") {
        this.removeOverlay();
      } else if (message.command === "removeOverlay") {
        this.removeOverlay();
      }
    });
  }

  showOverlayIcon() {
    const elementOffset = this.mostRecentlyFocusedFieldRects.height * 0.37;
    this.overlayIconElement.style.width = `${
      this.mostRecentlyFocusedFieldRects.height - elementOffset
    }px`;
    this.overlayIconElement.style.height = `${
      this.mostRecentlyFocusedFieldRects.height - elementOffset
    }px`;
    this.overlayIconElement.style.top = `${
      this.mostRecentlyFocusedFieldRects.top + window.scrollY + elementOffset / 2
    }px`;
    this.overlayIconElement.style.left = `${
      this.mostRecentlyFocusedFieldRects.left +
      window.scrollX +
      this.mostRecentlyFocusedFieldRects.width -
      this.mostRecentlyFocusedFieldRects.height +
      elementOffset / 2
    }px`;
    document.body.appendChild(this.overlayIconElement);
  }

  openAutofillOverlayList() {
    if (!this.mostRecentlyFocusedFieldRects) {
      return;
    }

    if (!this.overlayListElement) {
      this.createAutofillOverlayList();
    }

    this.showOverlayIcon();

    document.body.appendChild(this.overlayListElement);
    this.overlayListElement.style.width = `${this.mostRecentlyFocusedFieldRects.width}px`;
    this.overlayListElement.style.top = `${
      this.mostRecentlyFocusedFieldRects.top +
      this.mostRecentlyFocusedFieldRects.height +
      window.scrollY
    }px`;
    this.overlayListElement.style.left = `${
      this.mostRecentlyFocusedFieldRects.left + window.scrollX
    }px`;
  }

  setupOverlayIconListenerOnField(
    formFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ) {
    if (this.isIgnoredField(autofillFieldData)) {
      return;
    }

    if (!this.overlayIconElement) {
      this.createOverlayIconElement();
    }

    formFieldElement.addEventListener("focus", () => {
      this.mostRecentlyFocusedFieldRects = formFieldElement.getBoundingClientRect();
      chrome.runtime.sendMessage({ command: "bgOpenAutofillOverlayList" });
    });

    formFieldElement.addEventListener("blur", (details) => {
      chrome.runtime.sendMessage({ command: "bgCheckOverlayFocused" });
    });
  }

  private removeOverlay() {
    this.overlayIconElement?.remove();
    this.overlayListElement?.remove();
  }

  private isIgnoredField(autofillFieldData: AutofillField): boolean {
    const ignoredFieldTypes = ["hidden", "textarea"];

    if (
      autofillFieldData.readonly ||
      autofillFieldData.disabled ||
      ignoredFieldTypes.includes(autofillFieldData.type)
    ) {
      return true;
    }

    const ignoreKeywords = ["search", "captcha"];
    const searchedString = [
      autofillFieldData.htmlID,
      autofillFieldData.htmlName,
      autofillFieldData.htmlClass,
      autofillFieldData.type,
      autofillFieldData.title,
      autofillFieldData.placeholder,
      autofillFieldData["label-data"],
      autofillFieldData["label-aria"],
      autofillFieldData["label-left"],
      autofillFieldData["label-right"],
      autofillFieldData["label-tag"],
      autofillFieldData["label-top"],
    ]
      .join("")
      .toLowerCase();

    for (const keyword of ignoreKeywords) {
      if (searchedString.includes(keyword)) {
        return true;
      }
    }

    return false;
  }

  private createOverlayIconElement() {
    window.customElements?.define(
      "bitwarden-autofill-overlay-icon",
      class extends HTMLElement {
        constructor() {
          super();

          const shadow = this.attachShadow({ mode: "closed" });
          const iframe = document.createElement("iframe");
          iframe.style.border = "none";
          iframe.style.background = "transparent";
          iframe.style.margin = "0";
          iframe.style.padding = "0";
          iframe.style.width = "100%";
          iframe.style.height = "100%";
          iframe.src = chrome.runtime.getURL("overlay/icon.html");
          iframe.setAttribute("sandbox", "allow-scripts");

          shadow.appendChild(iframe);
        }
      }
    );

    this.overlayIconElement = document.createElement("bitwarden-autofill-overlay-icon");
    this.overlayIconElement.style.position = "fixed";
    this.overlayIconElement.style.display = "block";
    this.overlayIconElement.style.zIndex = "9999999999999999999999999";
    this.overlayIconElement.style.borderRadius = "4px";
    this.overlayIconElement.style.overflow = "hidden";
  }

  private createAutofillOverlayList() {
    window.customElements?.define(
      "bitwarden-autofill-overlay-list",
      class extends HTMLElement {
        constructor() {
          super();

          const shadow = this.attachShadow({ mode: "closed" });
          const iframe = document.createElement("iframe");
          iframe.style.border = "none";
          iframe.style.background = "transparent";
          iframe.style.margin = "0";
          iframe.style.padding = "0";
          iframe.style.width = "100%";
          iframe.style.height = "100%";
          iframe.src = chrome.runtime.getURL("overlay/list.html");
          iframe.setAttribute("sandbox", "allow-scripts");

          shadow.appendChild(iframe);
        }
      }
    );

    if (!this.overlayListElement) {
      this.overlayListElement = document.createElement("bitwarden-autofill-overlay-list");
      this.overlayListElement.style.position = "fixed";
      this.overlayListElement.style.display = "block";
      this.overlayListElement.style.zIndex = "9999999999999999999999999";
      this.overlayListElement.style.overflow = "hidden";
      this.overlayListElement.style.maxWidth = "300px";
      this.overlayListElement.style.height = "150px";
    }
  }
}

export default AutofillOverlayContentService;

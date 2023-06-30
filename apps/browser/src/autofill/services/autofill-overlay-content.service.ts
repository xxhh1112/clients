import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";

import AutofillField from "../models/autofill-field";
import { ElementWithOpId, FormFieldElement } from "../types";

import { AutofillOverlayContentService as AutofillOverlayContentServiceInterface } from "./abstractions/autofill-overlay-content.service";

class AutofillOverlayContentService implements AutofillOverlayContentServiceInterface {
  private isFillingForm: boolean;
  private overlayButtonElement: HTMLElement;
  private overlayListElement: HTMLElement;
  private mostRecentlyFocusedFieldRects: DOMRect;
  private removalTimeout: NodeJS.Timeout;

  constructor() {
    window.addEventListener("scroll", () => {
      this.overlayButtonElement?.remove();
      this.overlayListElement?.remove();
    });
    window.addEventListener("resize", () => {
      this.overlayButtonElement?.remove();
      this.overlayListElement?.remove();
    });
    document.body.addEventListener("scroll", () => {
      this.overlayButtonElement?.remove();
      this.overlayListElement?.remove();
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.command === "fillForm") {
        this.isFillingForm = true;
        this.overlayButtonElement?.remove();
        this.overlayListElement?.remove();
      }
    });
  }

  openAutofillOverlayList() {
    if (!this.overlayListElement) {
      this.createAutofillOverlayList();
    }

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

  setupOverlayButtonListenerOnField(
    formFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ) {
    if (this.isIgnoredField(autofillFieldData)) {
      return;
    }

    if (!this.overlayButtonElement) {
      this.createOverlayButtonElement();
    }

    formFieldElement.addEventListener("focus", () => {
      this.mostRecentlyFocusedFieldRects = formFieldElement.getBoundingClientRect();
      const elementOffset = this.mostRecentlyFocusedFieldRects.height * 0.2;
      document.body.appendChild(this.overlayButtonElement);
      this.overlayButtonElement.style.width = `${
        this.mostRecentlyFocusedFieldRects.height - elementOffset
      }px`;
      this.overlayButtonElement.style.height = `${
        this.mostRecentlyFocusedFieldRects.height - elementOffset
      }px`;
      this.overlayButtonElement.style.top = `${
        this.mostRecentlyFocusedFieldRects.top + window.scrollY + elementOffset / 2
      }px`;
      this.overlayButtonElement.style.left = `${
        this.mostRecentlyFocusedFieldRects.left +
        window.scrollX +
        this.mostRecentlyFocusedFieldRects.width -
        this.mostRecentlyFocusedFieldRects.height +
        elementOffset / 2
      }px`;
    });
    formFieldElement.addEventListener("blur", (details) => {
      // TODO: Need to think about a better way of dismissing the overlay button
      if (this.removalTimeout) {
        clearTimeout(this.removalTimeout);
      }

      this.removalTimeout = setTimeout(() => {
        this.overlayButtonElement?.remove();
      }, 125);
    });
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

  private createOverlayButtonElement() {
    window.customElements?.define(
      "bitwarden-autofill-overlay-button",
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
          iframe.src = chrome.runtime.getURL("overlay/button.html");
          iframe.setAttribute("sandbox", "allow-scripts");

          shadow.appendChild(iframe);
        }
      }
    );

    this.overlayButtonElement = document.createElement("bitwarden-autofill-overlay-button");
    this.overlayButtonElement.style.position = "fixed";
    this.overlayButtonElement.style.display = "block";
    this.overlayButtonElement.style.zIndex = "9999999999999999999999999";
    this.overlayButtonElement.style.borderRadius = "4px";
    this.overlayButtonElement.style.overflow = "hidden";
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

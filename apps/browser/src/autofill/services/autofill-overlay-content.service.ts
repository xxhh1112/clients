import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";

import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import AutofillField from "../models/autofill-field";
import { ElementWithOpId, FormFieldElement } from "../types";

import {
  AutofillOverlayContentService as AutofillOverlayContentServiceInterface,
  AutofillOverlayCustomElement,
} from "./abstractions/autofill-overlay-content.service";

class AutofillOverlayContentService implements AutofillOverlayContentServiceInterface {
  fieldCurrentlyFocused = false;
  currentlyFilling = false;
  private overlayIconElement: AutofillOverlayCustomElement;
  private overlayListElement: AutofillOverlayCustomElement;
  private mostRecentlyFocusedField: ElementWithOpId<FormFieldElement>;
  private mostRecentlyFocusedFieldRects: DOMRect;
  private authStatus: AuthenticationStatus;

  constructor() {
    window.addEventListener("scroll", this.removeAutofillOverlay);
    window.addEventListener("resize", this.removeAutofillOverlay);
    document.body?.addEventListener("scroll", this.removeAutofillOverlay);
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

  openAutofillOverlayList(authStatus?: AuthenticationStatus) {
    if (!this.mostRecentlyFocusedFieldRects) {
      return;
    }

    if (!this.overlayListElement) {
      this.createAutofillOverlayList();
    }

    if (this.authStatus !== authStatus) {
      this.authStatus = authStatus;
      this.overlayIconElement.updateIframeSource(`overlay/icon.html?authStatus=${authStatus}`);
      this.overlayListElement.updateIframeSource(`overlay/list.html?authStatus=${authStatus}`);
    }

    if (document.activeElement !== this.mostRecentlyFocusedField) {
      this.mostRecentlyFocusedField.focus();
    }

    this.showOverlayIcon();

    document.body.appendChild(this.overlayListElement);
    this.overlayListElement.style.width = `${this.mostRecentlyFocusedFieldRects.width}px`;

    // TODO: This is a VERY temporary measure to just show off work so far, it needs to be more robust in determining the height of the iframe. Most likely you'll need to add an observer to the list within the iframe and then send a message to the background to resize the iframe.
    this.overlayListElement.style.height =
      this.authStatus !== AuthenticationStatus.Unlocked ? "80px" : "205px";
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

    formFieldElement.addEventListener("focus", () =>
      this.triggerFormFieldFocusEvent(formFieldElement)
    );

    formFieldElement.addEventListener("blur", this.triggerFormFieldBlurEvent);

    if (document.activeElement === formFieldElement) {
      this.triggerFormFieldFocusEvent(formFieldElement);
    }
  }

  removeAutofillOverlay = () => {
    this.removeAutofillOverlayIcon();
    this.removeAutofillOverlayList();
  };

  removeAutofillOverlayIcon() {
    this.overlayIconElement?.remove();
  }

  removeAutofillOverlayList() {
    this.overlayListElement?.remove();
  }

  private triggerFormFieldFocusEvent = (formFieldElement: ElementWithOpId<FormFieldElement>) => {
    if (this.currentlyFilling) {
      return;
    }

    this.fieldCurrentlyFocused = true;
    this.mostRecentlyFocusedField = formFieldElement;
    this.mostRecentlyFocusedFieldRects = formFieldElement.getBoundingClientRect();

    if ((formFieldElement as HTMLInputElement).value) {
      this.showOverlayIcon();
      return;
    }

    chrome.runtime.sendMessage({ command: "bgOpenAutofillOverlayList" });
  };

  private triggerFormFieldBlurEvent = () => {
    this.fieldCurrentlyFocused = false;
    chrome.runtime.sendMessage({ command: "bgCheckOverlayFocused" });
  };

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
    if (this.overlayIconElement) {
      return;
    }

    this.overlayIconElement = this.createOverlayCustomElement("bitwarden-autofill-overlay-icon");
    this.overlayIconElement.style.lineHeight = "0";
  }

  private createAutofillOverlayList() {
    if (this.overlayListElement) {
      return;
    }

    this.overlayListElement = this.createOverlayCustomElement("bitwarden-autofill-overlay-list");
    this.overlayListElement.style.lineHeight = "0";
    this.overlayListElement.style.minWidth = "250px";
    this.overlayListElement.style.maxHeight = "210px";
    this.overlayListElement.style.boxShadow = "0 4px 4px 0 #00000040";
    this.overlayListElement.style.borderRadius = "4px";
    this.overlayListElement.style.backgroundColor = "#fff";
  }

  private createOverlayCustomElement(elementName: string): AutofillOverlayCustomElement {
    window.customElements?.define(
      elementName,
      class extends HTMLElement implements AutofillOverlayCustomElement {
        private shadow: ShadowRoot;
        private iframe: HTMLIFrameElement;

        constructor() {
          super();

          this.initOverlayCustomElement();
        }

        updateIframeSource(urlPath: string) {
          this.iframe.src = chrome.runtime.getURL(urlPath);
        }

        private initOverlayCustomElement() {
          this.iframe = document.createElement("iframe");
          this.iframe.style.border = "none";
          this.iframe.style.background = "transparent";
          this.iframe.style.margin = "0";
          this.iframe.style.padding = "0";
          this.iframe.style.width = "100%";
          this.iframe.style.height = "100%";
          this.iframe.setAttribute("sandbox", "allow-scripts");

          this.shadow = this.attachShadow({ mode: "closed" });
          this.shadow.appendChild(this.iframe);
        }
      }
    );
    const customElement = document.createElement(elementName) as AutofillOverlayCustomElement;
    customElement.style.position = "fixed";
    customElement.style.display = "block";
    customElement.style.zIndex = "9999999999999999999999999";
    customElement.style.overflow = "hidden";

    return customElement;
  }
}

export default AutofillOverlayContentService;

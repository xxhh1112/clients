import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";

import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import AutofillField from "../models/autofill-field";
import {
  AutofillOverlayIconIframe,
  AutofillOverlayListIframe,
} from "../overlay/utils/custom-element-iframes";
import { ElementWithOpId, FormFieldElement } from "../types";

import { AutofillOverlayContentService as AutofillOverlayContentServiceInterface } from "./abstractions/autofill-overlay-content.service";
import { AutoFillConstants } from "./autofill-constants";

class AutofillOverlayContentService implements AutofillOverlayContentServiceInterface {
  fieldCurrentlyFocused = false;
  currentlyFilling = false;
  private isOverlayIconVisible = false;
  private isOverlayListVisible = false;
  private overlayIconElement: HTMLElement;
  private overlayListElement: HTMLElement;
  private mostRecentlyFocusedField: ElementWithOpId<FormFieldElement>;
  private mostRecentlyFocusedFieldRects: DOMRect;
  private authStatus: AuthenticationStatus;

  constructor() {
    window.addEventListener("scroll", this.removeAutofillOverlay);
    window.addEventListener("resize", this.removeAutofillOverlay);
    document.body?.addEventListener("scroll", this.removeAutofillOverlay);
  }

  openAutofillOverlay(authStatus?: AuthenticationStatus) {
    if (!this.mostRecentlyFocusedFieldRects) {
      return;
    }

    if (this.authStatus !== authStatus) {
      this.authStatus = authStatus;
    }

    if (document.activeElement !== this.mostRecentlyFocusedField) {
      this.mostRecentlyFocusedField.focus();
    }

    this.showOverlayIcon();
    this.showOverlayList();
  }

  private showOverlayIcon() {
    if (!this.overlayIconElement) {
      this.createOverlayIconElement();
    }

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

    if (!this.isOverlayIconVisible) {
      document.body.appendChild(this.overlayIconElement);
      this.isOverlayIconVisible = true;
    }
  }

  private showOverlayList() {
    if (!this.overlayListElement) {
      this.createAutofillOverlayList();
    }

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

    if (!this.isOverlayListVisible) {
      document.body.appendChild(this.overlayListElement);
      this.isOverlayListVisible = true;
    }
  }

  setupOverlayIconListenerOnField(
    formFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ) {
    if (this.isIgnoredField(autofillFieldData)) {
      return;
    }

    formFieldElement.addEventListener("blur", () =>
      this.triggerFormFieldBlurEvent(formFieldElement)
    );

    formFieldElement.addEventListener("focus", () =>
      this.triggerFormFieldFocusEvent(formFieldElement)
    );

    if (document.activeElement === formFieldElement) {
      this.triggerFormFieldFocusEvent(formFieldElement);
    }
  }

  removeAutofillOverlay = () => {
    this.removeAutofillOverlayIcon();
    this.removeAutofillOverlayList();
  };

  removeAutofillOverlayIcon() {
    if (!this.overlayIconElement) {
      return;
    }

    this.overlayIconElement.remove();
    this.isOverlayIconVisible = false;
    chrome.runtime.sendMessage({ command: "bgAutofillOverlayIconClosed" });
  }

  removeAutofillOverlayList() {
    if (!this.overlayListElement) {
      return;
    }

    this.overlayListElement.remove();
    this.isOverlayListVisible = false;
    chrome.runtime.sendMessage({ command: "bgAutofillOverlayListClosed" });
  }

  private triggerFormFieldFocusEvent = (formFieldElement: ElementWithOpId<FormFieldElement>) => {
    if (this.currentlyFilling) {
      return;
    }

    this.fieldCurrentlyFocused = true;
    this.mostRecentlyFocusedField = formFieldElement;
    this.mostRecentlyFocusedFieldRects = formFieldElement.getBoundingClientRect();

    if ((formFieldElement as HTMLInputElement).value) {
      this.removeAutofillOverlayList();
      this.showOverlayIcon();
      return;
    }

    chrome.runtime.sendMessage({ command: "bgOpenAutofillOverlayList" });
  };

  private triggerFormFieldBlurEvent = (formFieldElement: ElementWithOpId<FormFieldElement>) => {
    this.fieldCurrentlyFocused = false;
    chrome.runtime.sendMessage({ command: "bgCheckOverlayFocused" });
  };

  private isIgnoredField(autofillFieldData: AutofillField): boolean {
    const ignoredFieldTypes = new Set(AutoFillConstants.ExcludedAutofillTypes);

    if (
      autofillFieldData.readonly ||
      autofillFieldData.disabled ||
      ignoredFieldTypes.has(autofillFieldData.type)
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

    if (autofillFieldData.type === "password") {
      return false;
    }

    // TODO: This is the current method we identify login autofill. This will need to change at some point as we want to be able to fill in other types of forms.
    for (const usernameKeyword of AutoFillConstants.UsernameFieldNames) {
      if (searchedString.includes(usernameKeyword)) {
        return false;
      }
    }

    return true;
  }

  private createOverlayIconElement() {
    if (this.overlayIconElement) {
      return;
    }

    const elementName = "bitwarden-autofill-overlay-icon";
    window.customElements?.define(elementName, AutofillOverlayIconIframe);
    this.overlayIconElement = this.createOverlayCustomElement(elementName);
    this.overlayIconElement.style.lineHeight = "0";
  }

  private createAutofillOverlayList() {
    if (this.overlayListElement) {
      return;
    }

    const elementName = "bitwarden-autofill-overlay-list";
    window.customElements?.define(elementName, AutofillOverlayListIframe);
    this.overlayListElement = this.createOverlayCustomElement(elementName);
    this.overlayListElement.style.lineHeight = "0";
    this.overlayListElement.style.minWidth = "250px";
    this.overlayListElement.style.maxHeight = "210px";
    this.overlayListElement.style.boxShadow = "0 4px 4px 0 #00000040";
    this.overlayListElement.style.borderRadius = "4px";
    this.overlayListElement.style.backgroundColor = "#fff";
  }

  private createOverlayCustomElement(elementName: string): HTMLElement {
    const customElement = document.createElement(elementName);
    customElement.style.position = "fixed";
    customElement.style.display = "block";
    customElement.style.zIndex = "9999999999999999999999999";
    customElement.style.overflow = "hidden";

    return customElement;
  }
}

export default AutofillOverlayContentService;

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
  isFieldCurrentlyFocused = false;
  isCurrentlyFilling = false;
  private isOverlayIconVisible = false;
  private isOverlayListVisible = false;
  private overlayIconElement: HTMLElement;
  private overlayListElement: HTMLElement;
  private mostRecentlyFocusedField: ElementWithOpId<FormFieldElement>;
  private mostRecentlyFocusedFieldRects: DOMRect;
  private authStatus: AuthenticationStatus;
  private userInteractionEventTimeout: NodeJS.Timeout;
  private mutationObserver: MutationObserver;

  constructor() {
    this.setupMutationObserver();
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

  openAutofillOverlay(authStatus?: AuthenticationStatus) {
    if (!this.mostRecentlyFocusedFieldRects) {
      return;
    }

    if (authStatus && this.authStatus !== authStatus) {
      this.authStatus = authStatus;
    }

    if (!this.recentlyFocusedFieldIsCurrentlyFocused()) {
      this.mostRecentlyFocusedField.focus();
    }

    this.updateOverlayIconPosition();
    this.updateOverlayListPosition();
  }

  private recentlyFocusedFieldIsCurrentlyFocused() {
    return document.activeElement === this.mostRecentlyFocusedField;
  }

  private updateOverlayIconPosition() {
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
      this.mostRecentlyFocusedFieldRects.top + elementOffset / 2
    }px`;
    this.overlayIconElement.style.left = `${
      this.mostRecentlyFocusedFieldRects.left +
      this.mostRecentlyFocusedFieldRects.width -
      this.mostRecentlyFocusedFieldRects.height +
      elementOffset / 2
    }px`;

    if (!this.isOverlayIconVisible) {
      document.body.appendChild(this.overlayIconElement);
      this.isOverlayIconVisible = true;
      this.setupUserInteractionEventListeners();
    }

    setTimeout(() => (this.overlayIconElement.style.opacity = "1"), 0);
  }

  private updateOverlayListPosition() {
    if (!this.overlayListElement) {
      this.createAutofillOverlayList();
    }

    // TODO: This is a VERY temporary measure to just show off work so far, it needs to be more robust in determining the height of the iframe. Most likely you'll need to add an observer to the list within the iframe and then send a message to the background to resize the iframe.
    this.overlayListElement.style.height =
      this.authStatus !== AuthenticationStatus.Unlocked ? "80px" : "205px";
    this.overlayListElement.style.width = `${this.mostRecentlyFocusedFieldRects.width}px`;
    this.overlayListElement.style.top = `${
      this.mostRecentlyFocusedFieldRects.top + this.mostRecentlyFocusedFieldRects.height
    }px`;
    this.overlayListElement.style.left = `${this.mostRecentlyFocusedFieldRects.left}px`;

    if (!this.isOverlayListVisible) {
      document.body.appendChild(this.overlayListElement);
      this.isOverlayListVisible = true;
    }

    setTimeout(() => (this.overlayListElement.style.opacity = "1"), 0);
  }

  removeAutofillOverlay = () => {
    return;

    this.removeAutofillOverlayIcon();
    this.removeAutofillOverlayList();
  };

  removeAutofillOverlayIcon() {
    if (!this.overlayIconElement) {
      return;
    }

    this.overlayIconElement.remove();
    this.overlayIconElement.style.opacity = "0";
    this.isOverlayIconVisible = false;
    chrome.runtime.sendMessage({ command: "bgAutofillOverlayIconClosed" });
    this.removeUserInteractionEventListeners();
  }

  removeAutofillOverlayList() {
    if (!this.overlayListElement) {
      return;
    }

    this.overlayListElement.remove();
    this.overlayListElement.style.opacity = "0";
    this.isOverlayListVisible = false;
    chrome.runtime.sendMessage({ command: "bgAutofillOverlayListClosed" });
  }

  private toggleOverlayHidden(isHidden: boolean) {
    const displayValue = isHidden ? "none" : "block";
    this.overlayIconElement?.style.setProperty("display", displayValue);
    this.overlayListElement?.style.setProperty("display", displayValue);

    this.isOverlayIconVisible = !isHidden;
    this.isOverlayListVisible = !isHidden;
  }

  private triggerFormFieldFocusEvent = (formFieldElement: ElementWithOpId<FormFieldElement>) => {
    if (this.isCurrentlyFilling) {
      return;
    }

    this.isFieldCurrentlyFocused = true;
    this.clearUserInteractionEventTimeout();
    this.updateMostRecentlyFocusedField(formFieldElement);

    if ((formFieldElement as HTMLInputElement).value) {
      this.removeAutofillOverlayList();
      this.updateOverlayIconPosition();
      return;
    }

    chrome.runtime.sendMessage({ command: "bgOpenAutofillOverlayList" });
  };

  private updateMostRecentlyFocusedField(formFieldElement: ElementWithOpId<FormFieldElement>) {
    this.mostRecentlyFocusedField = formFieldElement;
    this.mostRecentlyFocusedFieldRects = formFieldElement.getBoundingClientRect();
  }

  private triggerFormFieldBlurEvent = (formFieldElement: ElementWithOpId<FormFieldElement>) => {
    this.isFieldCurrentlyFocused = false;
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
    customElement.style.zIndex = "2147483648";
    customElement.style.overflow = "hidden";
    customElement.style.transition = "opacity 100ms ease-out";
    customElement.style.opacity = "0";

    return customElement;
  }

  private setupUserInteractionEventListeners() {
    document.body?.addEventListener("scroll", this.handleUserInteractionEvent);
    window.addEventListener("scroll", this.handleUserInteractionEvent);
    window.addEventListener("resize", this.handleUserInteractionEvent);
  }

  private removeUserInteractionEventListeners() {
    document.body?.removeEventListener("scroll", this.handleUserInteractionEvent);
    window.removeEventListener("scroll", this.handleUserInteractionEvent);
    window.removeEventListener("resize", this.handleUserInteractionEvent);
  }

  private handleUserInteractionEvent = (event: MouseEvent) => {
    if (!this.isOverlayIconVisible && !this.isOverlayListVisible) {
      return;
    }

    this.toggleOverlayHidden(true);
    this.clearUserInteractionEventTimeout();
    this.userInteractionEventTimeout = setTimeout(this.handleUserInteractionEventUpdates, 500);
  };

  private handleUserInteractionEventUpdates = () => {
    this.toggleOverlayHidden(false);
    if (!this.recentlyFocusedFieldIsCurrentlyFocused()) {
      this.removeAutofillOverlay();
      return;
    }

    this.updateMostRecentlyFocusedField(this.mostRecentlyFocusedField);
    this.updateOverlayIconPosition();
    this.updateOverlayListPosition();
    this.clearUserInteractionEventTimeout();
  };

  private clearUserInteractionEventTimeout() {
    if (this.userInteractionEventTimeout) {
      clearTimeout(this.userInteractionEventTimeout);
    }
  }

  private setupMutationObserver() {
    this.mutationObserver = new MutationObserver(this.handleMutationObserverUpdate);
    this.mutationObserver.observe(document.body, { childList: true });
  }

  private handleMutationObserverUpdate = (mutations: MutationRecord[]) => {
    if (!this.isOverlayIconVisible && !this.isOverlayListVisible) {
      return;
    }

    if (document.body.lastChild !== this.overlayListElement) {
      document.body.appendChild(this.overlayIconElement);
      document.body.appendChild(this.overlayListElement);
      return;
    }
  };
}

export default AutofillOverlayContentService;

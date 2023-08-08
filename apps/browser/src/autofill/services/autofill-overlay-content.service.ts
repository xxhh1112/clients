import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";

import { EventHandler } from "react";

import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import AutofillField from "../models/autofill-field";
import {
  AutofillOverlayIconIframe,
  AutofillOverlayListIframe,
} from "../overlay/utils/custom-element-iframes";
import { ElementWithOpId, FillableFormFieldElement, FormFieldElement } from "../types";

import { AutofillOverlayContentService as AutofillOverlayContentServiceInterface } from "./abstractions/autofill-overlay-content.service";
import { AutoFillConstants } from "./autofill-constants";

class AutofillOverlayContentService implements AutofillOverlayContentServiceInterface {
  isFieldCurrentlyFocused = false;
  isCurrentlyFilling = false;
  userFilledFields: Record<string, FillableFormFieldElement> = {};
  private isOverlayIconVisible = false;
  private isOverlayListVisible = false;
  private overlayIconElement: HTMLElement;
  private overlayListElement: HTMLElement;
  private mostRecentlyFocusedField: ElementWithOpId<FormFieldElement>;
  private mostRecentlyFocusedFieldRects: DOMRect;
  private authStatus: AuthenticationStatus;
  private userInteractionEventTimeout: NodeJS.Timeout;
  private mutationObserver: MutationObserver;
  private handlersMemo: { [key: string]: EventHandler<any> } = {};

  constructor() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", this.setupMutationObserver);
    } else {
      this.setupMutationObserver();
    }
  }

  setupOverlayIconListenerOnField(
    formFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ) {
    if (this.isIgnoredField(autofillFieldData)) {
      return;
    }

    formFieldElement.addEventListener("blur", this.handleFormFieldBlurEvent(formFieldElement));

    // TODO: Need to find a way to have the handler for click and focus events onyl trigger once. Currently we don't really handle whether this is visible in an effective manner.
    formFieldElement.addEventListener(
      "click",
      this.handleFormFieldUserInteractionEvent(formFieldElement)
    );
    formFieldElement.addEventListener(
      "focus",
      this.handleFormFieldUserInteractionEvent(formFieldElement)
    );
    formFieldElement.addEventListener("keyup", this.handleFormFieldKeyupEvent);

    // TODO: POCing out the vault item creation. This needs to be reworked.
    formFieldElement.addEventListener(
      "input",
      this.handleFormFieldInputEvent(formFieldElement, autofillFieldData)
    );

    if (document.activeElement === formFieldElement) {
      this.triggerFormFieldInteractionEvent(formFieldElement);
    }
  }

  updateAutofillOverlayListHeight(message: any) {
    if (!this.overlayListElement) {
      return;
    }

    const { height } = message;
    this.overlayListElement.style.height = `${height}px`;
    this.fadeInOverlayElements();
  }

  private handleFormFieldBlurEvent = (formFieldElement: ElementWithOpId<FormFieldElement>) => {
    const memoIndex = `${formFieldElement.opid}-${formFieldElement.id}-blur-handler`;
    return (
      this.handlersMemo[memoIndex] ||
      (this.handlersMemo[memoIndex] = () => this.triggerFormFieldBlurEvent(formFieldElement))
    );
  };

  private handleFormFieldUserInteractionEvent = (
    formFieldElement: ElementWithOpId<FormFieldElement>
  ) => {
    const memoIndex = `${formFieldElement.opid}-${formFieldElement.id}-user-interaction-handler`;
    return (
      this.handlersMemo[memoIndex] ||
      (this.handlersMemo[memoIndex] = () => this.triggerFormFieldInteractionEvent(formFieldElement))
    );
  };

  private handleFormFieldKeyupEvent = (event: KeyboardEvent) => {
    // if the event is for an esc key
    if (event.code === "Escape") {
      this.removeAutofillOverlay();
    }
  };

  openAutofillOverlay(authStatus?: AuthenticationStatus, focusFieldElement?: boolean) {
    if (!this.mostRecentlyFocusedFieldRects) {
      return;
    }

    if (authStatus && this.authStatus !== authStatus) {
      this.authStatus = authStatus;
    }

    if (focusFieldElement && !this.recentlyFocusedFieldIsCurrentlyFocused()) {
      this.mostRecentlyFocusedField.focus();
    }

    this.updateOverlayIconPosition();
    this.updateOverlayListPosition();
  }

  private recentlyFocusedFieldIsCurrentlyFocused() {
    return document.activeElement === this.mostRecentlyFocusedField;
  }

  private updateOverlayIconPosition(isOpeningWithoutList = false) {
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

    if (isOpeningWithoutList) {
      this.fadeInOverlayElements();
    }
  }

  private fadeInOverlayElements() {
    if (this.isOverlayIconVisible) {
      setTimeout(() => (this.overlayIconElement.style.opacity = "1"), 0);
    }

    if (this.isOverlayListVisible) {
      setTimeout(() => (this.overlayListElement.style.opacity = "1"), 0);
    }
  }

  private updateOverlayListPosition() {
    if (!this.overlayListElement) {
      this.createAutofillOverlayList();
    }

    this.overlayListElement.style.width = `${this.mostRecentlyFocusedFieldRects.width}px`;
    this.overlayListElement.style.top = `${
      this.mostRecentlyFocusedFieldRects.top + this.mostRecentlyFocusedFieldRects.height
    }px`;
    this.overlayListElement.style.left = `${this.mostRecentlyFocusedFieldRects.left}px`;

    if (!this.isOverlayListVisible) {
      document.body.appendChild(this.overlayListElement);
      this.isOverlayListVisible = true;
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
    this.overlayListElement.style.height = "0";
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

  private triggerFormFieldInteractionEvent = (
    formFieldElement: ElementWithOpId<FormFieldElement>
  ) => {
    if (this.isCurrentlyFilling) {
      return;
    }

    this.isFieldCurrentlyFocused = true;
    this.clearUserInteractionEventTimeout();
    const initiallyFocusedField = this.mostRecentlyFocusedField;
    this.updateMostRecentlyFocusedField(formFieldElement);

    if (
      this.authStatus === AuthenticationStatus.Unlocked &&
      (formFieldElement as HTMLInputElement).value
    ) {
      if (initiallyFocusedField !== this.mostRecentlyFocusedField) {
        this.removeAutofillOverlayList();
      }
      this.updateOverlayIconPosition(true);
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
      .filter((value) => !!value)
      .join(",")
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
    this.overlayListElement.style.height = "0";
    this.overlayListElement.style.lineHeight = "0";
    this.overlayListElement.style.minWidth = "250px";
    this.overlayListElement.style.maxHeight = "180px";
    this.overlayListElement.style.boxShadow = "0 4px 4px 0 #00000040";
    this.overlayListElement.style.borderRadius = "4px";
    this.overlayListElement.style.backgroundColor = "#fff";
  }

  private createOverlayCustomElement(elementName: string): HTMLElement {
    const customElement = document.createElement(elementName);
    customElement.style.opacity = "0";
    this.setDefaultOverlayStyles(customElement);

    return customElement;
  }

  private setDefaultOverlayStyles(customElement: HTMLElement) {
    customElement.style.position = "fixed";
    customElement.style.display = "block";
    customElement.style.zIndex = "2147483647";
    customElement.style.overflow = "hidden";
    customElement.style.transition = "opacity 125ms ease-out";
  }

  private isCustomElementStylesModified(customElement: HTMLElement): boolean {
    return (
      customElement.style.position !== "fixed" ||
      customElement.style.display !== "block" ||
      customElement.style.zIndex !== "2147483647" ||
      customElement.style.overflow !== "hidden" ||
      customElement.style.transition !== "opacity 125ms ease-out"
    );
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

  private setupMutationObserver = () => {
    this.mutationObserver = new MutationObserver(this.handleMutationObserverUpdate);
    this.mutationObserver.observe(document.body, { childList: true });
  };

  private handleMutationObserverUpdate = (mutations: MutationRecord[]) => {
    // TODO: This is a very rudimentary check to see if our overlay elements are going to be rendered above other elements.
    // In general, we need to think about this further and come up with a more robust solution.
    // The code below basically attempts to ensure that our two elements are always the last two elements in the body.
    // That, combined with the largest potential z-index value, should ensure that our elements are always on top.
    // However, a potential issue comes if a script on a site is determined to ensure that IT'S element is the last
    // within the body. We at that point will enter an infinite loop of sorts where we keep moving our elements to the end
    // of the body, and the script keeps moving its element to the end of the body. Potentially, it might be better to
    // also check the z-index of the last element in the body and ensure that our elements are always above that.
    // WARNING: It's really easy to trigger a infinite loop with this observer. Keep that in mind while updating this implementation.
    if (!this.isOverlayIconVisible && !this.isOverlayListVisible) {
      return;
    }

    if (
      this.isCustomElementStylesModified(this.overlayIconElement) ||
      this.isCustomElementStylesModified(this.overlayListElement)
    ) {
      this.setDefaultOverlayStyles(this.overlayIconElement);
      this.setDefaultOverlayStyles(this.overlayListElement);
    }

    const lastChild = document.body.lastChild;
    if (lastChild === this.overlayListElement || lastChild === this.overlayIconElement) {
      return;
    }

    this.removeAutofillOverlay();
    this.openAutofillOverlay();
  };

  // TODO: The following represents a first stab at creation of new vault items. It's not effective and needs to be entirely reworked.
  addNewVaultItem() {
    if (!this.isOverlayListVisible) {
      return;
    }

    const login = {
      username: this.userFilledFields["username"]?.value || "",
      password: this.userFilledFields["password"]?.value || "",
      uri: document.URL,
      hostname: document.location.hostname,
    };

    chrome.runtime.sendMessage({
      command: "bgAddNewVaultItem",
      login,
    });
  }

  // TODO: POCing out the vault item creation. This needs to be reworked.
  private handleFormFieldInputEvent = (
    formFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ) => {
    const memoIndex = `${formFieldElement.opid}-${formFieldElement.id}-input-handler`;
    return (
      this.handlersMemo[memoIndex] ||
      (this.handlersMemo[memoIndex] = () =>
        this.storeModifiedFormElement(
          formFieldElement as FillableFormFieldElement,
          autofillFieldData
        ))
    );
  };

  // TODO: POCing out the vault item creation. This needs to be reworked.
  private storeModifiedFormElement(
    formFieldElement: FillableFormFieldElement,
    autofillFieldData: AutofillField
  ) {
    if (!formFieldElement.value) {
      return;
    }

    formFieldElement.removeEventListener(
      "input",
      this.handleFormFieldInputEvent(
        formFieldElement as ElementWithOpId<FormFieldElement>,
        autofillFieldData
      )
    );

    if (formFieldElement.type === "password" && !this.userFilledFields.password) {
      this.userFilledFields.password = formFieldElement;
      return;
    }

    if (this.userFilledFields.username) {
      return;
    }

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
      .filter((value) => !!value)
      .join(",")
      .toLowerCase();

    // TODO: This is the current method we identify login autofill. This will need to change at some point as we want to be able to fill in other types of forms.
    for (const usernameKeyword of AutoFillConstants.UsernameFieldNames) {
      if (searchedString.includes(usernameKeyword)) {
        this.userFilledFields.username = formFieldElement;
        return;
      }
    }
  }
}

export default AutofillOverlayContentService;

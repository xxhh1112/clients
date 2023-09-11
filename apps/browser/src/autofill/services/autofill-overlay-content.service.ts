import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";
import { tabbable, FocusableElement } from "tabbable";

import { FocusedFieldData } from "../background/abstractions/overlay.background";
import { EVENTS } from "../constants";
import AutofillField from "../models/autofill-field";
import AutofillOverlayButtonIframe from "../overlay/iframe-content/autofill-overlay-button-iframe";
import AutofillOverlayListIframe from "../overlay/iframe-content/autofill-overlay-list-iframe";
import { ElementWithOpId, FillableFormFieldElement, FormFieldElement } from "../types";
import { AutofillOverlayElement, RedirectFocusDirection } from "../utils/autofill-overlay.enum";
import {
  generateRandomCustomElementName,
  sendExtensionMessage,
  setElementStyles,
} from "../utils/utils";

import { AutofillOverlayContentService as AutofillOverlayContentServiceInterface } from "./abstractions/autofill-overlay-content.service";
import { AutoFillConstants } from "./autofill-constants";

class AutofillOverlayContentService implements AutofillOverlayContentServiceInterface {
  private readonly findTabs = tabbable;
  isFieldCurrentlyFocused = false;
  isCurrentlyFilling = false;
  userFilledFields: Record<string, FillableFormFieldElement> = {};
  private focusableElements: FocusableElement[] = [];
  private isOverlayButtonVisible = false;
  private isOverlayListVisible = false;
  private overlayButtonElement: HTMLElement;
  private overlayListElement: HTMLElement;
  private mostRecentlyFocusedField: ElementWithOpId<FormFieldElement>;
  private focusedFieldData: FocusedFieldData;
  private userInteractionEventTimeout: NodeJS.Timeout;
  private overlayElementsMutationObserver: MutationObserver;
  private bodyElementMutationObserver: MutationObserver;
  private mutationObserverIterations = 0;
  private mutationObserverIterationsResetTimeout: NodeJS.Timeout;
  private autofillFieldKeywordsMap: WeakMap<AutofillField, string> = new WeakMap();
  private eventHandlersMemo: { [key: string]: EventListener } = {};
  private readonly customElementDefaultStyles: Partial<CSSStyleDeclaration> = {
    all: "initial",
    position: "fixed",
    display: "block",
    zIndex: "2147483647",
  };

  constructor() {
    this.initOverlayOnDomContentLoaded();
  }

  setupAutofillOverlayListenerOnField(
    formFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ) {
    if (this.isIgnoredField(autofillFieldData)) {
      return;
    }

    this.removeCachedFormFieldEventListeners(formFieldElement);

    formFieldElement.addEventListener(EVENTS.BLUR, this.handleFormFieldBlurEvent);
    formFieldElement.addEventListener(EVENTS.KEYUP, this.handleFormFieldKeyupEvent);
    formFieldElement.addEventListener(
      EVENTS.INPUT,
      this.handleFormFieldInputEvent(formFieldElement, autofillFieldData)
    );
    formFieldElement.addEventListener(
      EVENTS.CLICK,
      this.handleFormFieldClickEvent(formFieldElement)
    );
    formFieldElement.addEventListener(
      EVENTS.FOCUS,
      this.handleFormFieldFocusEvent(formFieldElement)
    );

    if (this.getRootNodeActiveElement(formFieldElement) === formFieldElement) {
      this.triggerFormFieldFocusedAction(formFieldElement);
      return;
    }

    if (!this.mostRecentlyFocusedField) {
      this.updateMostRecentlyFocusedField(formFieldElement);
    }
  }

  openAutofillOverlay(focusFieldElement?: boolean) {
    if (!this.mostRecentlyFocusedField) {
      return;
    }

    if (focusFieldElement && !this.recentlyFocusedFieldIsCurrentlyFocused()) {
      this.focusMostRecentOverlayField();
    }

    this.updateOverlayElementsPosition();
  }

  focusMostRecentOverlayField() {
    this.mostRecentlyFocusedField?.focus();
  }

  blurMostRecentOverlayField() {
    this.mostRecentlyFocusedField?.blur();
  }

  removeAutofillOverlay = () => {
    this.unobserveBodyElement();
    this.removeAutofillOverlayButton();
    this.removeAutofillOverlayList();
  };

  removeAutofillOverlayButton() {
    if (!this.overlayButtonElement) {
      return;
    }

    this.overlayButtonElement.remove();
    this.isOverlayButtonVisible = false;
    sendExtensionMessage("autofillOverlayElementClosed", {
      overlayElement: AutofillOverlayElement.Button,
    });
    this.removeOverlayRepositionEventListeners();
  }

  removeAutofillOverlayList() {
    if (!this.overlayListElement) {
      return;
    }

    this.overlayListElement.remove();
    this.isOverlayListVisible = false;
    sendExtensionMessage("autofillOverlayElementClosed", {
      overlayElement: AutofillOverlayElement.List,
    });
  }

  addNewVaultItem() {
    if (!this.isOverlayListVisible) {
      return;
    }

    const login = {
      username: this.userFilledFields["username"]?.value || "",
      password: this.userFilledFields["password"]?.value || "",
      uri: globalThis.document.URL,
      hostname: globalThis.document.location.hostname,
    };

    sendExtensionMessage("autofillOverlayAddNewVaultItem", { login });
  }

  redirectOverlayFocusOut(direction: string) {
    if (!this.isOverlayListVisible || !this.mostRecentlyFocusedField) {
      return;
    }

    if (direction === RedirectFocusDirection.Current) {
      this.focusMostRecentOverlayField();
      setTimeout(this.removeAutofillOverlay, 100);
      return;
    }

    if (!this.focusableElements.length) {
      this.focusableElements = this.findTabs(globalThis.document.body, { getShadowRoot: true });
    }

    const focusedElementIndex = this.focusableElements.findIndex(
      (element) => element === this.mostRecentlyFocusedField
    );

    const indexOffset = direction === RedirectFocusDirection.Previous ? -1 : 1;
    const redirectFocusElement = this.focusableElements[focusedElementIndex + indexOffset];
    redirectFocusElement?.focus();
  }

  private removeCachedFormFieldEventListeners(formFieldElement: ElementWithOpId<FormFieldElement>) {
    const handlers = [EVENTS.INPUT, EVENTS.CLICK, EVENTS.FOCUS];
    for (let index = 0; index < handlers.length; index++) {
      const event = handlers[index];
      const memoIndex = this.getFormFieldHandlerMemoIndex(formFieldElement, event);
      const existingHandler = this.eventHandlersMemo[memoIndex];
      if (!existingHandler) {
        return;
      }

      formFieldElement.removeEventListener(event, existingHandler);
      delete this.eventHandlersMemo[memoIndex];
    }
  }

  private useEventHandlersMemo = (eventHandler: EventListener, memoIndex: string) => {
    return this.eventHandlersMemo[memoIndex] || (this.eventHandlersMemo[memoIndex] = eventHandler);
  };

  private getFormFieldHandlerMemoIndex(
    formFieldElement: ElementWithOpId<FormFieldElement>,
    event: string
  ) {
    return `${formFieldElement.opid}-${formFieldElement.id}-${event}-handler`;
  }

  private handleFormFieldBlurEvent = () => {
    this.isFieldCurrentlyFocused = false;
    sendExtensionMessage("checkAutofillOverlayFocused");
  };

  private handleFormFieldKeyupEvent = (event: KeyboardEvent) => {
    const eventCode = event.code;
    if (eventCode === "Escape") {
      this.removeAutofillOverlay();
      return;
    }

    if (eventCode === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();

      this.focusOverlayList();
    }
  };

  private focusOverlayList() {
    if (!this.isOverlayListVisible) {
      this.openAutofillOverlay();
      setTimeout(() => sendExtensionMessage("focusAutofillOverlayList"), 125);
      return;
    }

    sendExtensionMessage("focusAutofillOverlayList");
  }

  private handleFormFieldInputEvent = (
    formFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ) => {
    return this.useEventHandlersMemo(
      () => this.triggerFormFieldInput(formFieldElement, autofillFieldData),
      this.getFormFieldHandlerMemoIndex(formFieldElement, EVENTS.INPUT)
    );
  };

  triggerFormFieldInput(
    formFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ) {
    if (formFieldElement instanceof HTMLSpanElement) {
      return;
    }

    this.storeModifiedFormElement(formFieldElement, autofillFieldData);

    if (formFieldElement.value) {
      this.removeAutofillOverlayList();
      return;
    }

    this.openAutofillOverlay();
  }

  private storeModifiedFormElement(
    formFieldElement: ElementWithOpId<FillableFormFieldElement>,
    autofillFieldData: AutofillField
  ) {
    if (formFieldElement === this.mostRecentlyFocusedField) {
      this.mostRecentlyFocusedField = formFieldElement;
    }

    if (formFieldElement.type === "password") {
      this.userFilledFields.password = formFieldElement;
      return;
    }

    if (!this.keywordsFoundInFieldData(autofillFieldData, AutoFillConstants.UsernameFieldNames)) {
      return;
    }

    this.userFilledFields.username = formFieldElement;
  }

  private handleFormFieldClickEvent = (formFieldElement: ElementWithOpId<FormFieldElement>) => {
    return this.useEventHandlersMemo(
      () => this.triggerFormFieldClickedAction(formFieldElement),
      this.getFormFieldHandlerMemoIndex(formFieldElement, EVENTS.CLICK)
    );
  };

  private async triggerFormFieldClickedAction(formFieldElement: ElementWithOpId<FormFieldElement>) {
    if (this.isOverlayButtonVisible || this.isOverlayListVisible) {
      return;
    }

    await this.triggerFormFieldFocusedAction(formFieldElement);
  }

  private handleFormFieldFocusEvent = (formFieldElement: ElementWithOpId<FormFieldElement>) => {
    return this.useEventHandlersMemo(
      () => this.triggerFormFieldFocusedAction(formFieldElement),
      this.getFormFieldHandlerMemoIndex(formFieldElement, EVENTS.FOCUS)
    );
  };

  private async triggerFormFieldFocusedAction(formFieldElement: ElementWithOpId<FormFieldElement>) {
    if (this.isCurrentlyFilling) {
      return;
    }

    this.isFieldCurrentlyFocused = true;
    this.clearUserInteractionEventTimeout();
    const initiallyFocusedField = this.mostRecentlyFocusedField;
    await this.updateMostRecentlyFocusedField(formFieldElement);

    if (!(formFieldElement as HTMLInputElement).value) {
      sendExtensionMessage("openAutofillOverlay");
      return;
    }

    if (initiallyFocusedField !== this.mostRecentlyFocusedField) {
      this.removeAutofillOverlayList();
    }

    this.updateOverlayButtonPosition();
  }

  private keywordsFoundInFieldData(autofillFieldData: AutofillField, keywords: string[]) {
    const searchedString = this.getAutofillFieldDataKeywords(autofillFieldData);
    return keywords.some((keyword) => searchedString.includes(keyword));
  }

  private getAutofillFieldDataKeywords(autofillFieldData: AutofillField) {
    if (this.autofillFieldKeywordsMap.has(autofillFieldData)) {
      return this.autofillFieldKeywordsMap.get(autofillFieldData);
    }

    const keywordValues = [
      autofillFieldData.htmlID,
      autofillFieldData.htmlName,
      autofillFieldData.htmlClass,
      autofillFieldData.type,
      autofillFieldData.title,
      autofillFieldData.placeholder,
      autofillFieldData.autoCompleteType,
      autofillFieldData["label-data"],
      autofillFieldData["label-aria"],
      autofillFieldData["label-left"],
      autofillFieldData["label-right"],
      autofillFieldData["label-tag"],
      autofillFieldData["label-top"],
    ]
      .join(",")
      .toLowerCase();
    this.autofillFieldKeywordsMap.set(autofillFieldData, keywordValues);

    return keywordValues;
  }

  private recentlyFocusedFieldIsCurrentlyFocused() {
    return (
      this.getRootNodeActiveElement(this.mostRecentlyFocusedField) === this.mostRecentlyFocusedField
    );
  }

  private updateOverlayElementsPosition() {
    this.updateOverlayButtonPosition();
    this.updateOverlayListPosition();
  }

  private updateOverlayButtonPosition() {
    if (!this.overlayButtonElement) {
      this.createAutofillOverlayButton();
    }

    if (!this.mostRecentlyFocusedField) {
      return;
    }

    if (!this.isOverlayButtonVisible) {
      this.appendOverlayElementToBody(this.overlayButtonElement);
      this.isOverlayButtonVisible = true;
      this.setOverlayRepositionEventListeners();
    }
    sendExtensionMessage("updateAutofillOverlayPosition", {
      overlayElement: AutofillOverlayElement.Button,
    });
  }

  private updateOverlayListPosition() {
    if (!this.overlayListElement) {
      this.createAutofillOverlayList();
    }

    if (!this.mostRecentlyFocusedField) {
      return;
    }

    if (!this.isOverlayListVisible) {
      this.appendOverlayElementToBody(this.overlayListElement);
      this.isOverlayListVisible = true;
    }

    sendExtensionMessage("updateAutofillOverlayPosition", {
      overlayElement: AutofillOverlayElement.List,
    });
  }

  private appendOverlayElementToBody(element: HTMLElement) {
    this.observerBodyElement();
    globalThis.document.body.appendChild(element);
  }

  private toggleOverlayHidden(isHidden: boolean) {
    const displayValue = isHidden ? "none" : "block";
    sendExtensionMessage("updateAutofillOverlayHidden", { display: displayValue });

    this.isOverlayButtonVisible = !isHidden;
    this.isOverlayListVisible = !isHidden;
  }

  private async updateMostRecentlyFocusedField(
    formFieldElement: ElementWithOpId<FormFieldElement>
  ) {
    this.mostRecentlyFocusedField = formFieldElement;
    const { paddingRight, paddingLeft } = globalThis.getComputedStyle(formFieldElement);
    const { width, height, top, left } = await this.getMostRecentlyFocusedFieldRects(
      formFieldElement
    );
    this.focusedFieldData = {
      focusedFieldStyles: { paddingRight, paddingLeft },
      focusedFieldRects: { width, height, top, left },
    };

    sendExtensionMessage("updateFocusedFieldData", { focusedFieldData: this.focusedFieldData });
  }

  private async getMostRecentlyFocusedFieldRects(
    formFieldElement: ElementWithOpId<FormFieldElement>
  ) {
    const focusedFieldRects = await this.getBoundingClientRectFromIntersectionObserver(
      formFieldElement
    );
    if (focusedFieldRects) {
      return focusedFieldRects;
    }

    return formFieldElement.getBoundingClientRect();
  }

  private async getBoundingClientRectFromIntersectionObserver(
    formFieldElement: ElementWithOpId<FormFieldElement>
  ): Promise<DOMRectReadOnly | null> {
    if (!("IntersectionObserver" in window) && !("IntersectionObserverEntry" in window)) {
      return null;
    }

    return new Promise((resolve) => {
      const intersectionObserver = new IntersectionObserver(
        (entries) => {
          let fieldBoundingClientRects = entries[0]?.boundingClientRect;
          if (!fieldBoundingClientRects?.width || !fieldBoundingClientRects.height) {
            fieldBoundingClientRects = null;
          }

          intersectionObserver.disconnect();
          resolve(fieldBoundingClientRects);
        },
        {
          root: globalThis.document.body,
          rootMargin: "0px",
          threshold: 0.9999, // Safari doesn't seem to function properly with a threshold of 1
        }
      );
      intersectionObserver.observe(formFieldElement);
    });
  }

  private isIgnoredField(autofillFieldData: AutofillField): boolean {
    const ignoredFieldTypes = new Set(AutoFillConstants.ExcludedAutofillTypes);
    if (
      autofillFieldData.readonly ||
      autofillFieldData.disabled ||
      !autofillFieldData.viewable ||
      ignoredFieldTypes.has(autofillFieldData.type) ||
      this.keywordsFoundInFieldData(autofillFieldData, ["search", "captcha"])
    ) {
      return true;
    }

    // TODO: CG - This is the current method we used to identify login fields. This will need to change at some point as we want to be able to fill in other types of forms.
    const isLoginCipherField =
      autofillFieldData.type === "password" ||
      this.keywordsFoundInFieldData(autofillFieldData, AutoFillConstants.UsernameFieldNames);

    return !isLoginCipherField;
  }

  private createAutofillOverlayButton() {
    if (this.overlayButtonElement) {
      return;
    }

    const customElementName = generateRandomCustomElementName();
    globalThis.customElements?.define(customElementName, AutofillOverlayButtonIframe);
    this.overlayButtonElement = globalThis.document.createElement(customElementName);

    this.updateCustomElementDefaultStyles(this.overlayButtonElement);
  }

  private createAutofillOverlayList() {
    if (this.overlayListElement) {
      return;
    }

    const customElementName = generateRandomCustomElementName();
    globalThis.customElements?.define(customElementName, AutofillOverlayListIframe);
    this.overlayListElement = globalThis.document.createElement(customElementName);

    this.updateCustomElementDefaultStyles(this.overlayListElement);
  }

  private updateCustomElementDefaultStyles(element: HTMLElement) {
    this.unobserveCustomElements();

    setElementStyles(element, this.customElementDefaultStyles, "important");

    this.observeCustomElements();
  }

  private setOverlayRepositionEventListeners() {
    globalThis.document.body?.addEventListener(EVENTS.SCROLL, this.handleOverlayRepositionEvent);
    globalThis.addEventListener(EVENTS.SCROLL, this.handleOverlayRepositionEvent);
    globalThis.addEventListener(EVENTS.RESIZE, this.handleOverlayRepositionEvent);
  }

  private removeOverlayRepositionEventListeners() {
    globalThis.document.body?.removeEventListener(EVENTS.SCROLL, this.handleOverlayRepositionEvent);
    globalThis.removeEventListener(EVENTS.SCROLL, this.handleOverlayRepositionEvent);
    globalThis.removeEventListener(EVENTS.RESIZE, this.handleOverlayRepositionEvent);
  }

  private handleOverlayRepositionEvent = () => {
    if (!this.isOverlayButtonVisible && !this.isOverlayListVisible) {
      return;
    }

    this.toggleOverlayHidden(true);
    this.clearUserInteractionEventTimeout();
    this.userInteractionEventTimeout = setTimeout(this.triggerOverlayRepositionUpdates, 750);
  };

  private triggerOverlayRepositionUpdates = async () => {
    if (!this.recentlyFocusedFieldIsCurrentlyFocused()) {
      this.toggleOverlayHidden(false);
      this.removeAutofillOverlay();
      return;
    }

    await this.updateMostRecentlyFocusedField(this.mostRecentlyFocusedField);
    this.updateOverlayElementsPosition();
    this.toggleOverlayHidden(false);
    this.clearUserInteractionEventTimeout();

    if (this.focusedFieldData.focusedFieldRects?.top > 0) {
      return;
    }

    this.removeAutofillOverlay();
  };

  private clearUserInteractionEventTimeout() {
    if (this.userInteractionEventTimeout) {
      clearTimeout(this.userInteractionEventTimeout);
    }
  }

  private initOverlayOnDomContentLoaded() {
    if (globalThis.document.readyState === "loading") {
      globalThis.document.addEventListener(
        EVENTS.DOMCONTENTLOADED,
        this.handleDomContentLoadedEvent
      );
      return;
    }

    this.handleDomContentLoadedEvent();
  }

  private handleDomContentLoadedEvent = () => {
    this.setupMutationObserver();
  };

  private setupMutationObserver = () => {
    this.overlayElementsMutationObserver = new MutationObserver(
      this.handleOverlayElementMutationObserverUpdate
    );

    this.bodyElementMutationObserver = new MutationObserver(
      this.handleBodyElementMutationObserverUpdate
    );

    const documentElementMutationObserver = new MutationObserver(
      this.handleDocumentElementMutationObserverUpdate
    );
    documentElementMutationObserver.observe(globalThis.document.documentElement, {
      childList: true,
    });
  };

  private observeCustomElements() {
    if (this.overlayButtonElement) {
      this.overlayElementsMutationObserver?.observe(this.overlayButtonElement, {
        attributes: true,
      });
    }

    if (this.overlayListElement) {
      this.overlayElementsMutationObserver?.observe(this.overlayListElement, { attributes: true });
    }
  }

  private unobserveCustomElements() {
    this.overlayElementsMutationObserver?.disconnect();
  }

  private observerBodyElement() {
    this.bodyElementMutationObserver?.observe(globalThis.document.body, { childList: true });
  }

  private unobserveBodyElement() {
    this.bodyElementMutationObserver?.disconnect();
  }

  private handleOverlayElementMutationObserverUpdate = (mutationRecord: MutationRecord[]) => {
    if (this.isTriggeringExcessiveMutationObserverIterations()) {
      return;
    }

    for (let recordIndex = 0; recordIndex < mutationRecord.length; recordIndex++) {
      const record = mutationRecord[recordIndex];
      if (record.type !== "attributes") {
        continue;
      }

      const element = record.target as HTMLElement;
      if (record.attributeName !== "style") {
        this.removeModifiedElementAttributes(element);

        continue;
      }

      element.removeAttribute("style");
      this.updateCustomElementDefaultStyles(element);
    }
  };

  private removeModifiedElementAttributes(element: HTMLElement) {
    const attributes = Array.from(element.attributes);
    for (let attributeIndex = 0; attributeIndex < attributes.length; attributeIndex++) {
      const attribute = attributes[attributeIndex];
      if (attribute.name === "style") {
        continue;
      }

      element.removeAttribute(attribute.name);
    }
  }

  private handleBodyElementMutationObserverUpdate = () => {
    if (this.isTriggeringExcessiveMutationObserverIterations()) {
      return;
    }

    const lastChild = globalThis.document.body.lastChild;
    const secondToLastChild = lastChild?.previousSibling;
    const lastChildIsOverlayList = lastChild === this.overlayListElement;
    const lastChildIsOverlayButton = lastChild === this.overlayButtonElement;
    const secondToLastChildIsOverlayList = secondToLastChild === this.overlayListElement;
    const secondToLastChildIsOverlayButton = secondToLastChild === this.overlayButtonElement;
    if (
      (lastChildIsOverlayList && secondToLastChildIsOverlayButton) ||
      (lastChildIsOverlayButton && !this.isOverlayListVisible)
    ) {
      return;
    }

    if (lastChildIsOverlayList && !secondToLastChildIsOverlayButton) {
      globalThis.document.body.insertBefore(
        this.overlayButtonElement,
        this.overlayListElement.nextSibling
      );
      return;
    }

    if (lastChildIsOverlayButton && secondToLastChildIsOverlayList) {
      globalThis.document.body.insertBefore(
        this.overlayListElement,
        this.overlayButtonElement.nextSibling
      );
      return;
    }

    globalThis.document.body.insertBefore(lastChild, this.overlayButtonElement);
  };

  private handleDocumentElementMutationObserverUpdate = (mutationRecords: MutationRecord[]) => {
    // TODO - Think about this decision. This is a heavy handed approach to solve the question of "What if someone attempts to overlay our element using an element within the `<html>` tag?"
    // There might be better ways to handle this, and given that we are directly modifying the DOM for a third party website, this isn't entirely desirable to do.

    if (this.isTriggeringExcessiveMutationObserverIterations()) {
      return;
    }

    const ignoredElements = new Set([globalThis.document.body, globalThis.document.head]);
    for (const record of mutationRecords) {
      if (record.type !== "childList" || record.addedNodes.length === 0) {
        continue;
      }

      for (const node of record.addedNodes) {
        if (ignoredElements.has(node as HTMLElement)) {
          continue;
        }

        globalThis.document.body.appendChild(node);
      }
    }
  };

  private isTriggeringExcessiveMutationObserverIterations() {
    if (this.mutationObserverIterationsResetTimeout) {
      clearTimeout(this.mutationObserverIterationsResetTimeout);
    }

    this.mutationObserverIterations++;
    this.mutationObserverIterationsResetTimeout = setTimeout(
      () => (this.mutationObserverIterations = 0),
      2000
    );

    if (this.mutationObserverIterations > 100) {
      clearTimeout(this.mutationObserverIterationsResetTimeout);
      this.mutationObserverIterations = 0;
      this.blurMostRecentOverlayField();
      this.removeAutofillOverlay();

      return true;
    }

    return false;
  }

  private getRootNodeActiveElement(element: Element): Element {
    const documentRoot = element.getRootNode() as ShadowRoot | Document;
    return documentRoot?.activeElement;
  }
}

export default AutofillOverlayContentService;

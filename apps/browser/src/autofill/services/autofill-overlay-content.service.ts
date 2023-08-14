import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";

import { EventHandler } from "react";

import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import AutofillField from "../models/autofill-field";
import {
  AutofillOverlayIconIframe,
  AutofillOverlayListIframe,
} from "../overlay/custom-element-iframes/custom-element-iframes";
import { AutofillOverlayCustomElement } from "../overlay/utils/autofill-overlay.enum";
import { sendExtensionMessage } from "../overlay/utils/utils";
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
  private mostRecentlyFocusedFieldRects: DOMRect | null;
  private mostRecentlyFocusedFieldStyles: CSSStyleDeclaration;
  private authStatus: AuthenticationStatus;
  private userInteractionEventTimeout: NodeJS.Timeout;
  private mutationObserver: MutationObserver;
  private mutationObserverIterations = 0;
  private mutationObserverIterationsResetTimeout: NodeJS.Timeout;
  private autofillFieldKeywordsMap: WeakMap<AutofillField, string> = new WeakMap();
  private eventHandlersMemo: { [key: string]: EventHandler<any> } = {};

  constructor() {
    this.initMutationObserver();
  }

  setupOverlayIconListenerOnField(
    formFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ) {
    if (this.isIgnoredField(autofillFieldData)) {
      return;
    }

    formFieldElement.addEventListener("blur", this.handleFormFieldBlurEvent);
    formFieldElement.addEventListener("keyup", this.handleFormFieldKeyupEvent);
    formFieldElement.addEventListener(
      "input",
      this.handleFormFieldInputEvent(formFieldElement, autofillFieldData)
    );
    formFieldElement.addEventListener("click", this.handleFormFieldClickEvent(formFieldElement));
    formFieldElement.addEventListener("focus", this.handleFormFieldFocusEvent(formFieldElement));

    if (document.activeElement === formFieldElement) {
      this.triggerFormFieldFocusedAction(formFieldElement);
    }
  }

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

    this.updateOverlayElementsPosition();
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
    sendExtensionMessage("bgAutofillOverlayIconClosed");
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
    sendExtensionMessage("bgAutofillOverlayListClosed");
  }

  updateAutofillOverlayListHeight(message: any) {
    const updatedHeight = message?.height;
    if (!this.overlayListElement || !updatedHeight) {
      return;
    }

    this.overlayListElement.style.height = `${updatedHeight}px`;
    this.fadeInOverlayElements();
  }

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

    sendExtensionMessage("bgAddNewVaultItem", { login });
  }

  private useEventHandlersMemo = (callback: EventHandler<any>, memoIndex: string) => {
    return this.eventHandlersMemo[memoIndex] || (this.eventHandlersMemo[memoIndex] = callback);
  };

  private handleFormFieldBlurEvent = () => {
    this.isFieldCurrentlyFocused = false;
    sendExtensionMessage("bgCheckOverlayFocused");
  };

  private handleFormFieldKeyupEvent = (event: KeyboardEvent) => {
    if (event.code === "Escape") {
      this.removeAutofillOverlay();
    }
  };

  private handleFormFieldInputEvent = (
    formFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ) => {
    return this.useEventHandlersMemo(
      () => this.storeModifiedFormElement(formFieldElement, autofillFieldData),
      `${formFieldElement.opid}-${formFieldElement.id}-input-handler`
    );
  };

  private storeModifiedFormElement(
    formFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ) {
    formFieldElement.removeEventListener(
      "input",
      this.handleFormFieldInputEvent(formFieldElement, autofillFieldData)
    );

    if (formFieldElement instanceof HTMLSpanElement) {
      return;
    }

    if (!this.userFilledFields.password && formFieldElement.type === "password") {
      this.userFilledFields.password = formFieldElement;
      return;
    }

    if (
      this.userFilledFields.username ||
      !this.keywordsFoundInFieldData(autofillFieldData, AutoFillConstants.UsernameFieldNames)
    ) {
      return;
    }

    this.userFilledFields.username = formFieldElement;
  }

  private handleFormFieldClickEvent = (formFieldElement: ElementWithOpId<FormFieldElement>) => {
    return this.useEventHandlersMemo(
      () => this.triggerFormFieldClickedAction(formFieldElement),
      `${formFieldElement.opid}-${formFieldElement.id}-click-handler`
    );
  };

  private async triggerFormFieldClickedAction(formFieldElement: ElementWithOpId<FormFieldElement>) {
    if (this.isOverlayIconVisible || this.isOverlayListVisible) {
      return;
    }

    await this.triggerFormFieldFocusedAction(formFieldElement);
  }

  private handleFormFieldFocusEvent = (formFieldElement: ElementWithOpId<FormFieldElement>) => {
    return this.useEventHandlersMemo(
      () => this.triggerFormFieldFocusedAction(formFieldElement),
      `${formFieldElement.opid}-${formFieldElement.id}-focus-handler`
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

    if (
      this.authStatus !== AuthenticationStatus.Unlocked ||
      !(formFieldElement as HTMLInputElement).value
    ) {
      sendExtensionMessage("bgOpenAutofillOverlayList");
      return;
    }

    if (initiallyFocusedField !== this.mostRecentlyFocusedField) {
      this.removeAutofillOverlayList();
    }

    this.updateOverlayIconPosition(true);
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
    return document.activeElement === this.mostRecentlyFocusedField;
  }

  private updateOverlayElementsPosition() {
    this.updateOverlayIconPosition();
    this.updateOverlayListPosition();
  }

  private updateOverlayIconPosition(isOpeningWithoutList = false) {
    if (!this.overlayIconElement) {
      this.createOverlayIconElement();
    }

    if (!this.mostRecentlyFocusedFieldRects) {
      return;
    }

    const elementOffset = this.mostRecentlyFocusedFieldRects.height * 0.37;
    const elementWidth = this.mostRecentlyFocusedFieldRects.height - elementOffset;
    const elementHeight = this.mostRecentlyFocusedFieldRects.height - elementOffset;
    const elementTopPosition = this.mostRecentlyFocusedFieldRects.top + elementOffset / 2;
    const elementLeftPosition = this.getOverlayIconLeftPosition(elementOffset);

    this.overlayIconElement.style.width = `${elementWidth}px`;
    this.overlayIconElement.style.height = `${elementHeight}px`;
    this.overlayIconElement.style.top = `${elementTopPosition}px`;
    this.overlayIconElement.style.left = `${elementLeftPosition}px`;

    if (!this.isOverlayIconVisible) {
      document.body.appendChild(this.overlayIconElement);
      this.isOverlayIconVisible = true;
      this.setupUserInteractionEventListeners();
    }

    if (isOpeningWithoutList) {
      this.fadeInOverlayElements();
    }

    // const elementsFromPoint = document.elementsFromPoint(
    //   elementLeftPosition + elementWidth / 2,
    //   elementTopPosition + elementHeight / 2
    // );
  }

  private getOverlayIconLeftPosition(elementOffset: number) {
    const fieldPaddingRight = parseInt(this.mostRecentlyFocusedFieldStyles.paddingRight, 10);
    const fieldPaddingLeft = parseInt(this.mostRecentlyFocusedFieldStyles.paddingLeft, 10);
    if (fieldPaddingRight > fieldPaddingLeft) {
      return (
        this.mostRecentlyFocusedFieldRects.left +
        this.mostRecentlyFocusedFieldRects.width -
        this.mostRecentlyFocusedFieldRects.height -
        (fieldPaddingRight - elementOffset + 2)
      );
    }

    return (
      this.mostRecentlyFocusedFieldRects.left +
      this.mostRecentlyFocusedFieldRects.width -
      this.mostRecentlyFocusedFieldRects.height +
      elementOffset / 2
    );
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

    if (!this.mostRecentlyFocusedFieldRects) {
      return;
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

  private toggleOverlayHidden(isHidden: boolean) {
    const displayValue = isHidden ? "none" : "block";
    this.overlayIconElement?.style.setProperty("display", displayValue);
    this.overlayListElement?.style.setProperty("display", displayValue);

    this.isOverlayIconVisible = !isHidden;
    this.isOverlayListVisible = !isHidden;
  }

  private async updateMostRecentlyFocusedField(
    formFieldElement: ElementWithOpId<FormFieldElement>
  ) {
    this.mostRecentlyFocusedField = formFieldElement;
    await this.updateMostRecentlyFocusedFieldRects(formFieldElement);
    this.mostRecentlyFocusedFieldStyles = window.getComputedStyle(formFieldElement);
  }

  private async updateMostRecentlyFocusedFieldRects(
    formFieldElement: ElementWithOpId<FormFieldElement>
  ) {
    this.mostRecentlyFocusedFieldRects = await this.getBoundingClientRectFromIntersectionObserver(
      formFieldElement
    );
    if (this.mostRecentlyFocusedFieldRects) {
      return;
    }

    this.mostRecentlyFocusedFieldRects = formFieldElement.getBoundingClientRect();
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
          root: document.body,
          rootMargin: "0px",
          threshold: 0.9999,
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

  private createOverlayIconElement() {
    if (this.overlayIconElement) {
      return;
    }

    window.customElements?.define(
      AutofillOverlayCustomElement.BitwardenIcon,
      AutofillOverlayIconIframe
    );
    this.overlayIconElement = this.createOverlayCustomElement(
      AutofillOverlayCustomElement.BitwardenIcon
    );
    this.overlayIconElement.style.lineHeight = "0";
  }

  private createAutofillOverlayList() {
    if (this.overlayListElement) {
      return;
    }

    window.customElements?.define(
      AutofillOverlayCustomElement.BitwardenList,
      AutofillOverlayListIframe
    );
    this.overlayListElement = this.createOverlayCustomElement(
      AutofillOverlayCustomElement.BitwardenList
    );
    this.overlayListElement.style.height = "0";
    this.overlayListElement.style.lineHeight = "0";
    this.overlayListElement.style.minWidth = "250px";
    this.overlayListElement.style.maxHeight = "180px";
    this.overlayListElement.style.boxShadow = "2px 4px 6px 0px rgba(0, 0, 0, 0.1)";
    this.overlayListElement.style.borderRadius = "4px";
    this.overlayListElement.style.border = "1px solid rgb(206, 212, 220)";
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

  private handleUserInteractionEvent = () => {
    if (!this.isOverlayIconVisible && !this.isOverlayListVisible) {
      return;
    }

    this.toggleOverlayHidden(true);
    this.clearUserInteractionEventTimeout();
    this.userInteractionEventTimeout = setTimeout(this.handleUserInteractionEventUpdates, 500);
  };

  private handleUserInteractionEventUpdates = async () => {
    if (!this.recentlyFocusedFieldIsCurrentlyFocused()) {
      this.toggleOverlayHidden(false);
      this.removeAutofillOverlay();
      return;
    }

    await this.updateMostRecentlyFocusedField(this.mostRecentlyFocusedField);
    this.toggleOverlayHidden(false);
    this.updateOverlayElementsPosition();
    this.clearUserInteractionEventTimeout();
  };

  private clearUserInteractionEventTimeout() {
    if (this.userInteractionEventTimeout) {
      clearTimeout(this.userInteractionEventTimeout);
    }
  }

  private initMutationObserver = () => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", this.setupMutationObserver);
      return;
    }

    this.setupMutationObserver();
  };

  private setupMutationObserver = () => {
    this.mutationObserver = new MutationObserver(this.handleMutationObserverUpdate);
    this.mutationObserver.observe(document.body, { childList: true });

    // TODO: CG - Need to consider cases where an attached DOM element outside of the body is attempting to be rendered above our overlay elements. This might require a separate mutation observer instance.
    // this.mutationObserver.observe(document.documentElement, { childList: true });
  };

  private handleMutationObserverUpdate = (mutations: MutationRecord[]) => {
    // TODO: CG - This is a very rudimentary check to see if our overlay elements are going to be rendered above other elements.
    // In general, we need to think about this further and come up with a more robust solution.
    // The code below basically attempts to ensure that our two elements are always the last two elements in the body.
    // That, combined with the largest potential z-index value, should ensure that our elements are always on top.
    // However, a potential issue comes if a script on a site is determined to ensure that IT'S element is the last
    // within the body. We at that point will enter an infinite loop of sorts where we keep moving our elements to the end
    // of the body, and the script keeps moving its element to the end of the body. Potentially, it might be better to
    // also check the z-index of the last element in the body and ensure that our elements are always above that.
    //
    // WARNING: It's really easy to trigger a infinite loop with this observer. Keep that in mind while updating this implementation.
    if (this.mutationObserverIterationsResetTimeout) {
      clearTimeout(this.mutationObserverIterationsResetTimeout);
    }

    if (!this.isOverlayIconVisible && !this.isOverlayListVisible) {
      return;
    }
    this.mutationObserverIterations++;
    this.mutationObserverIterationsResetTimeout = setTimeout(
      () => (this.mutationObserverIterations = 0),
      3000
    );

    if (this.mutationObserverIterations > 10) {
      this.mutationObserverIterations = 0;
      clearTimeout(this.mutationObserverIterationsResetTimeout);
      this.removeAutofillOverlay();
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
}

export default AutofillOverlayContentService;

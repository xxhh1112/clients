import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";

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
  private authStatus: AuthenticationStatus;
  private userInteractionEventTimeout: NodeJS.Timeout;
  private mutationObserverIterations = 0;
  private mutationObserverIterationsResetTimeout: NodeJS.Timeout;
  private autofillFieldKeywordsMap: WeakMap<AutofillField, string> = new WeakMap();
  private eventHandlersMemo: { [key: string]: EventListener } = {};

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
    if (!this.mostRecentlyFocusedField) {
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
    this.isOverlayIconVisible = false;
    sendExtensionMessage("bgAutofillOverlayIconClosed");
    this.removeOverlayRepositionEventListeners();
  }

  removeAutofillOverlayList() {
    if (!this.overlayListElement) {
      return;
    }

    this.overlayListElement.remove();
    this.isOverlayListVisible = false;
    sendExtensionMessage("bgAutofillOverlayListClosed");
  }

  updateAutofillOverlayListHeight(message: any) {
    const updatedHeight = message?.height;
    if (!this.overlayListElement || !updatedHeight) {
      return;
    }
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

  private useEventHandlersMemo = (eventHandler: EventListener, memoIndex: string) => {
    return this.eventHandlersMemo[memoIndex] || (this.eventHandlersMemo[memoIndex] = eventHandler);
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

    this.updateOverlayIconPosition();
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

  private updateOverlayIconPosition() {
    if (!this.overlayIconElement) {
      this.createOverlayIconElement();
    }

    if (!this.mostRecentlyFocusedField) {
      return;
    }

    if (!this.isOverlayIconVisible) {
      document.body.appendChild(this.overlayIconElement);
      this.isOverlayIconVisible = true;
      this.setOverlayRepositionEventListeners();
    }
    sendExtensionMessage("bgUpdateAutofillOverlayIconPosition");
  }

  private updateOverlayListPosition() {
    if (!this.overlayListElement) {
      this.createAutofillOverlayList();
    }

    if (!this.mostRecentlyFocusedField) {
      return;
    }

    if (!this.isOverlayListVisible) {
      document.body.appendChild(this.overlayListElement);
      this.isOverlayListVisible = true;
    }

    sendExtensionMessage("bgUpdateAutofillOverlayListPosition");
  }

  private toggleOverlayHidden(isHidden: boolean) {
    const displayValue = isHidden ? "none" : "block";
    sendExtensionMessage("bgUpdateOverlayHidden", { display: displayValue });

    this.isOverlayIconVisible = !isHidden;
    this.isOverlayListVisible = !isHidden;
  }

  private async updateMostRecentlyFocusedField(
    formFieldElement: ElementWithOpId<FormFieldElement>
  ) {
    this.mostRecentlyFocusedField = formFieldElement;
    const { paddingRight, paddingLeft } = window.getComputedStyle(formFieldElement);
    const { width, height, top, left } = await this.getMostRecentlyFocusedFieldRects(
      formFieldElement
    );
    const focusedFieldData = {
      focusedFieldStyles: { paddingRight, paddingLeft },
      focusedFieldRects: { width, height, top, left },
    };

    sendExtensionMessage("bgUpdateFocusedFieldData", { focusedFieldData });
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

    const mutationObserver = new MutationObserver(this.handleOverlayElementMutationObserverUpdate);
    mutationObserver.observe(this.overlayIconElement, { attributes: true });
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

    const mutationObserver = new MutationObserver(this.handleOverlayElementMutationObserverUpdate);
    mutationObserver.observe(this.overlayListElement, { attributes: true });
  }

  private createOverlayCustomElement(elementName: string): HTMLElement {
    const customElement = document.createElement(elementName);

    return customElement;
  }

  private setOverlayRepositionEventListeners() {
    document.body?.addEventListener("scroll", this.handleOverlayRepositionEvent);
    window.addEventListener("scroll", this.handleOverlayRepositionEvent);
    window.addEventListener("resize", this.handleOverlayRepositionEvent);
  }

  private removeOverlayRepositionEventListeners() {
    document.body?.removeEventListener("scroll", this.handleOverlayRepositionEvent);
    window.removeEventListener("scroll", this.handleOverlayRepositionEvent);
    window.removeEventListener("resize", this.handleOverlayRepositionEvent);
  }

  private handleOverlayRepositionEvent = () => {
    if (!this.isOverlayIconVisible && !this.isOverlayListVisible) {
      return;
    }

    this.toggleOverlayHidden(true);
    this.clearUserInteractionEventTimeout();
    this.userInteractionEventTimeout = setTimeout(this.triggerOverlayRepositionUpdates, 500);
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
    const bodyMutationObserver = new MutationObserver(this.handleBodyElementMutationObserverUpdate);
    bodyMutationObserver.observe(document.body, { childList: true });

    const documentElementMutationObserver = new MutationObserver(
      this.handleDocumentElementMutationObserverUpdate
    );
    documentElementMutationObserver.observe(document.documentElement, { childList: true });
  };

  private handleOverlayElementMutationObserverUpdate = (mutationRecord: MutationRecord[]) => {
    mutationRecord.forEach((record) => {
      if (record.type !== "attributes") {
        return;
      }

      const element = record.target as HTMLElement;
      const attributes = Array.from(element.attributes);
      attributes.forEach((attribute) => element.removeAttribute(attribute.name));
    });
  };

  private handleBodyElementMutationObserverUpdate = () => {
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
      2000
    );

    if (this.mutationObserverIterations > 200) {
      this.mutationObserverIterations = 0;
      clearTimeout(this.mutationObserverIterationsResetTimeout);
      this.removeAutofillOverlay();
      return;
    }

    const lastChild = document.body.lastChild;
    if (
      lastChild === this.overlayListElement ||
      (lastChild === this.overlayIconElement && !this.isOverlayListVisible)
    ) {
      return;
    }

    this.removeAutofillOverlay();
    this.openAutofillOverlay();
  };

  private handleDocumentElementMutationObserverUpdate = (mutationRecords: MutationRecord[]) => {
    // TODO - Think about this decision. This is a heavy handed approach to solve the question of "What if someone attempts to overlay our element using an element within the `<html>` tag?"
    // There might be better ways to handle this, and given that we are directly modifying the DOM for a third party website, this isn't entirely desirable to do.

    const ignoredElements = new Set([document.body, document.head]);
    for (const record of mutationRecords) {
      if (record.type !== "childList" || record.addedNodes.length === 0) {
        continue;
      }

      for (const node of record.addedNodes) {
        if (ignoredElements.has(node as HTMLElement)) {
          continue;
        }

        document.body.appendChild(node);
      }
    }
  };
}

export default AutofillOverlayContentService;

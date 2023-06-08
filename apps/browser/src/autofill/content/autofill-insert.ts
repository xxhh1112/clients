import { EVENTS, TYPE_CHECK } from "../constants";
import AutofillScript, { AutofillInsertActions, FillScript } from "../models/autofill-script";
import AutofillFieldVisibilityService from "../services/autofill-field-visibility.service";
import { FormElement } from "../types";

import AutofillCollect from "./autofill-collect";

class AutofillInsert {
  private readonly autofillFieldVisibility: AutofillFieldVisibilityService;
  private readonly autofillCollect: AutofillCollect;
  private readonly autofillInsertActions: AutofillInsertActions = {
    fill_by_opid: ({ opid, value }) => this.fillFieldByOpid(opid, value),
    click_on_opid: ({ opid }) => this.clickOnFieldByOpid(opid),
    focus_by_opid: ({ opid }) => this.focusOnFieldByOpid(opid),
  };

  constructor(
    autofillFieldVisibility: AutofillFieldVisibilityService,
    autofillCollect: AutofillCollect
  ) {
    this.autofillFieldVisibility = autofillFieldVisibility;
    this.autofillCollect = autofillCollect;
  }

  fillForm(fillScript: AutofillScript) {
    if (
      !fillScript?.script ||
      this.fillingWithinSandBoxedIframe() ||
      this.urlNotSecure(fillScript.savedUrls) ||
      !this.userWillAllowUntrustedIframeAutofill(fillScript)
    ) {
      return;
    }

    fillScript.script.forEach(this.runFillScriptAction);
  }

  private runFillScriptAction = ([action, opid, value]: FillScript, actionIndex: number): void => {
    if (!this.autofillInsertActions[action]) {
      return;
    }

    const delayActionsInMilliseconds = 20;
    setTimeout(
      () => this.autofillInsertActions[action]({ opid, value }),
      delayActionsInMilliseconds * actionIndex
    );
  };

  private fillFieldByOpid(opid: string | undefined, value: string) {
    if (!opid) {
      return;
    }

    const element = this.autofillCollect.getAutofillFieldElementByOpid(opid);
    this.insertValueIntoField(element, value);
  }

  private clickOnFieldByOpid(opid: string) {
    const element = this.autofillCollect.getAutofillFieldElementByOpid(opid);
    this.triggerClickOnElement(element);
  }

  private focusOnFieldByOpid(opid: string) {
    const element = this.autofillCollect.getAutofillFieldElementByOpid(opid);
    this.triggerFocusOnElement(element);
  }

  private insertValueIntoField(element: FormElement, value: string) {
    const elementCanBeReadonly =
      element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
    const elementCanBeFilled = elementCanBeReadonly || element instanceof HTMLSelectElement;

    if (
      !element ||
      !value ||
      (elementCanBeFilled && element.disabled) ||
      (elementCanBeReadonly && element.readOnly)
    ) {
      return;
    }

    const elementType = elementCanBeFilled ? element.type : "";
    const isFillableCheckboxOrRadioElement =
      new Set(["checkbox", "radio"]).has(elementType) &&
      new Set(["true", "y", "1", "yes", "✓"]).has(String(value).toLowerCase());
    if (isFillableCheckboxOrRadioElement) {
      this.doAllFillOperations(element, function (theElement: any) {
        theElement.checked = true;
      });

      return;
    }

    this.doAllFillOperations(element, function (theElement: any) {
      if (!theElement.type && theElement.tagName.toLowerCase() === "span") {
        theElement.innerText = value;

        return;
      }

      theElement.value = value;
    });
  }

  private fillingWithinSandBoxedIframe() {
    return String(self.origin).toLowerCase() === "null";
  }

  private urlNotSecure(savedUrls?: string[] | null): boolean {
    if (
      !savedUrls?.length ||
      !savedUrls.some((url) => url.startsWith("https://")) ||
      window.location.protocol !== "http:" ||
      !document.querySelectorAll("input[type=password]")?.length
    ) {
      return false;
    }

    const confirmationWarning = [
      chrome.i18n.getMessage("insecurePageWarning"),
      chrome.i18n.getMessage("insecurePageWarningFillPrompt", [window.location.hostname]),
    ].join("\n\n");

    return !confirm(confirmationWarning);
  }

  private userWillAllowUntrustedIframeAutofill(fillScript: AutofillScript): boolean {
    if (!fillScript.untrustedIframe) {
      return true;
    }

    // confirm() is blocked by sandboxed iframes, but we don't want to fill sandboxed iframes anyway.
    // If this occurs, confirm() returns false without displaying the dialog box, and autofill will be aborted.
    // The browser may print a message to the console, but this is not a standard error that we can handle.
    const confirmationWarning = [
      chrome.i18n.getMessage("autofillIframeWarning"),
      chrome.i18n.getMessage("autofillIframeWarningTip", [window.location.hostname]),
    ].join("\n\n");

    return confirm(confirmationWarning);
  }

  private doAllFillOperations(element: FormElement, callback: CallableFunction): void {
    if (!element) {
      return;
    }

    this.simulateClickAndKeyboardEventsOnElement(element);
    callback(element);
    this.simulateInputChangeEventOnElement(element);

    if (!this.canAnimateElement(element)) {
      return;
    }

    element.classList.add("com-bitwarden-browser-animated-fill");
    setTimeout(() => element.classList.remove("com-bitwarden-browser-animated-fill"), 200);
  }

  // TODO - Think through whether this is a good idea or not... why are we simulating events? What purpose does it serve?
  private simulateClickAndKeyboardEventsOnElement(element: FormElement): void {
    const initialElementValue = "value" in element ? element.value : "";

    this.triggerClickOnElement(element);
    this.triggerFocusOnElement(element);
    this.triggerKeyboardEventOnElement(element, EVENTS.KEYDOWN);
    this.triggerKeyboardEventOnElement(element, EVENTS.KEYPRESS);
    this.triggerKeyboardEventOnElement(element, EVENTS.KEYUP);

    if ("value" in element && initialElementValue !== element.value) {
      element.value = initialElementValue;
    }
  }

  // TODO - Again, why are we simulating events? What purpose does it serve? Are we doing this in the correct order?
  private simulateInputChangeEventOnElement(element: FormElement): void {
    const autofilledValue = "value" in element ? element.value : "";

    this.triggerKeyboardEventOnElement(element, EVENTS.KEYDOWN);
    this.triggerKeyboardEventOnElement(element, EVENTS.KEYPRESS);
    this.triggerKeyboardEventOnElement(element, EVENTS.KEYUP);
    this.triggerEventOnElement(element, EVENTS.INPUT);
    this.triggerEventOnElement(element, EVENTS.CHANGE);
    element.blur();

    if ("value" in element && autofilledValue !== element.value) {
      element.value = autofilledValue;
    }

    // TODO - For instance, if we are inserting a value, an SPA is expecting an input event to be fired, but we are not firing it.
    // This causes issues where the site attempts to do validation on the input, but the validation erases the value we just inserted.
    this.triggerEventOnElement(element, EVENTS.INPUT);
    this.triggerEventOnElement(element, EVENTS.CHANGE);
  }

  private triggerEventOnElement(element: FormElement, eventType: string): void {
    element.dispatchEvent(new Event(eventType, { bubbles: true }));
  }

  private triggerKeyboardEventOnElement(element: HTMLElement, eventType: string): void {
    element.dispatchEvent(new KeyboardEvent(eventType, { bubbles: true }));
  }

  private triggerClickOnElement(element?: HTMLElement): void {
    if (!element || typeof element.click !== TYPE_CHECK.FUNCTION) {
      return;
    }

    element.click();
  }

  private triggerFocusOnElement(element?: HTMLElement): void {
    if (!element || typeof element.focus !== TYPE_CHECK.FUNCTION) {
      return;
    }

    element.focus();
  }

  private canAnimateElement(element: FormElement): boolean {
    if (this.autofillFieldVisibility.isFieldHiddenByCss(element)) {
      return false;
    }

    return (
      element instanceof HTMLSpanElement ||
      new Set(["email", "text", "password", "number", "tel", "url"]).has(element.type)
    );
  }
}

export default AutofillInsert;

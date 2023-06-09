import { EVENTS, TYPE_CHECK } from "../constants";
import AutofillScript, { AutofillInsertActions, FillScript } from "../models/autofill-script";
import { FormFieldElement } from "../types";

import { InsertAutofillContentService as InsertAutofillContentServiceInterface } from "./abstractions/insert-autofill-content.service";
import CollectAutofillContentService from "./collect-autofill-content.service";
import FormFieldVisibilityService from "./form-field-visibility.service";

class InsertAutofillContentService implements InsertAutofillContentServiceInterface {
  private readonly formFieldVisibilityService: FormFieldVisibilityService;
  private readonly collectAutofillContentService: CollectAutofillContentService;
  private readonly autofillInsertActions: AutofillInsertActions = {
    fill_by_opid: ({ opid, value }) => this.fillFieldByOpid(opid, value),
    click_on_opid: ({ opid }) => this.clickOnFieldByOpid(opid),
    focus_by_opid: ({ opid }) => this.focusOnFieldByOpid(opid),
  };

  constructor(
    formFieldVisibilityService: FormFieldVisibilityService,
    collectAutofillContentService: CollectAutofillContentService
  ) {
    this.formFieldVisibilityService = formFieldVisibilityService;
    this.collectAutofillContentService = collectAutofillContentService;
  }

  fillForm(fillScript: AutofillScript) {
    if (
      !fillScript?.script ||
      this.fillingWithinSandBoxedIframe() ||
      this.userCancelledInsecureUrlAutofill(fillScript.savedUrls) ||
      this.userCancelledUntrustedIframeAutofill(fillScript)
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

    const element = this.collectAutofillContentService.getAutofillFieldElementByOpid(opid);
    this.insertValueIntoField(element, value);
  }

  private clickOnFieldByOpid(opid: string) {
    const element = this.collectAutofillContentService.getAutofillFieldElementByOpid(opid);
    this.triggerClickOnElement(element);
  }

  private focusOnFieldByOpid(opid: string) {
    const element = this.collectAutofillContentService.getAutofillFieldElementByOpid(opid);
    this.triggerFocusOnElement(element);
  }

  private insertValueIntoField(element: FormFieldElement, value: string) {
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

  private userCancelledInsecureUrlAutofill(savedUrls?: string[] | null): boolean {
    if (
      !savedUrls?.some((url) => url.startsWith("https://")) ||
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

  private userCancelledUntrustedIframeAutofill(fillScript: AutofillScript): boolean {
    if (!fillScript.untrustedIframe) {
      return false;
    }

    // confirm() is blocked by sandboxed iframes, but we don't want to fill sandboxed iframes anyway.
    // If this occurs, confirm() returns false without displaying the dialog box, and autofill will be aborted.
    // The browser may print a message to the console, but this is not a standard error that we can handle.
    const confirmationWarning = [
      chrome.i18n.getMessage("autofillIframeWarning"),
      chrome.i18n.getMessage("autofillIframeWarningTip", [window.location.hostname]),
    ].join("\n\n");

    return !confirm(confirmationWarning);
  }

  private doAllFillOperations(element: FormFieldElement, callback: CallableFunction): void {
    if (!element) {
      return;
    }

    this.simulateClickAndKeyboardEventsOnElement(element);
    callback(element);
    this.simulateInputChangeEventOnElement(element);

    if (!this.canElementBeAnimated(element)) {
      return;
    }

    element.classList.add("com-bitwarden-browser-animated-fill");
    setTimeout(() => element.classList.remove("com-bitwarden-browser-animated-fill"), 200);
  }

  private simulateClickAndKeyboardEventsOnElement(element: FormFieldElement): void {
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

  private simulateInputChangeEventOnElement(element: FormFieldElement): void {
    const autofilledValue = "value" in element ? element.value : "";

    this.triggerKeyboardEventOnElement(element, EVENTS.KEYDOWN);
    this.triggerKeyboardEventOnElement(element, EVENTS.KEYPRESS);
    this.triggerKeyboardEventOnElement(element, EVENTS.KEYUP);

    if ("value" in element && autofilledValue !== element.value) {
      element.value = autofilledValue;
    }

    this.triggerEventOnElement(element, EVENTS.INPUT);
    this.triggerEventOnElement(element, EVENTS.CHANGE);
    element.blur();
  }

  private triggerEventOnElement(element: FormFieldElement, eventType: string): void {
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

  private canElementBeAnimated(element: FormFieldElement): boolean {
    if (this.formFieldVisibilityService.isFieldHiddenByCss(element)) {
      return false;
    }

    return (
      element instanceof HTMLSpanElement ||
      new Set(["email", "text", "password", "number", "tel", "url"]).has(element.type)
    );
  }
}

export default InsertAutofillContentService;

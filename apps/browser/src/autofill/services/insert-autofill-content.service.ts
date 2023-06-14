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
    fill_by_opid: ({ opid, value }) => this.handleFillFieldByOpidAction(opid, value),
    click_on_opid: ({ opid }) => this.handleClickOnFieldByOpidAction(opid),
    focus_by_opid: ({ opid }) => this.handleFocusOnFieldByOpidAction(opid),
  };

  /**
   * InsertAutofillContentService constructor. Instantiates the
   * FormFieldVisibilityService and CollectAutofillContentService classes.
   */
  constructor(
    formFieldVisibilityService: FormFieldVisibilityService,
    collectAutofillContentService: CollectAutofillContentService
  ) {
    this.formFieldVisibilityService = formFieldVisibilityService;
    this.collectAutofillContentService = collectAutofillContentService;
  }

  /**
   * Handles autofill of the forms on the current page based on the
   * data within the passed fill script object.
   * @param {AutofillScript} fillScript
   * @public
   */
  fillForm(fillScript: AutofillScript) {
    if (
      !fillScript.script?.length ||
      this.fillingWithinSandboxedIframe() ||
      this.userCancelledInsecureUrlAutofill(fillScript.savedUrls) ||
      this.userCancelledUntrustedIframeAutofill(fillScript)
    ) {
      return;
    }

    fillScript.script.forEach(this.runFillScriptAction);
  }

  /**
   * Identifies if the execution of this script is happening
   * within a sandboxed iframe.
   * @returns {boolean}
   * @private
   */
  private fillingWithinSandboxedIframe() {
    return String(self.origin).toLowerCase() === "null";
  }

  /**
   * Checks if the autofill is occurring on a page that can be considered secure. If the page is not secure,
   * the user is prompted to confirm that they want to autofill on the page.
   * @param {string[] | null} savedUrls
   * @returns {boolean}
   * @private
   */
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

  /**
   * Checking if the autofill is occurring within an untrusted iframe. If the page is within an untrusted iframe,
   * the user is prompted to confirm that they want to autofill on the page. If the user cancels the autofill,
   * the script will not continue.
   *
   * Note: confirm() is blocked by sandboxed iframes, but we don't want to fill sandboxed iframes anyway.
   * If this occurs, confirm() returns false without displaying the dialog box, and autofill will be aborted.
   * The browser may print a message to the console, but this is not a standard error that we can handle.
   * @param {AutofillScript} fillScript
   * @returns {boolean}
   * @private
   */
  private userCancelledUntrustedIframeAutofill(fillScript: AutofillScript): boolean {
    if (!fillScript.untrustedIframe) {
      return false;
    }

    const confirmationWarning = [
      chrome.i18n.getMessage("autofillIframeWarning"),
      chrome.i18n.getMessage("autofillIframeWarningTip", [window.location.hostname]),
    ].join("\n\n");

    return !confirm(confirmationWarning);
  }

  /**
   * Runs the autofill action based on the action type and the opid.
   * Each action is subsequently delayed by 20 milliseconds.
   * @param {FillScriptActions} action
   * @param {string} opid
   * @param {string} value
   * @param {number} actionIndex
   */
  private runFillScriptAction = ([action, opid, value]: FillScript, actionIndex: number): void => {
    if (!opid || !this.autofillInsertActions[action]) {
      return;
    }

    const delayActionsInMilliseconds = 20;
    setTimeout(
      () => this.autofillInsertActions[action]({ opid, value }),
      delayActionsInMilliseconds * actionIndex
    );
  };

  private handleFillFieldByOpidAction(opid: string, value: string) {
    const element = this.collectAutofillContentService.getAutofillFieldElementByOpid(opid);
    this.insertValueIntoField(element, value);
  }

  /**
   * Handles finding an element by opid and triggering a click event on the element.
   * @param {string} opid
   * @private
   */
  private handleClickOnFieldByOpidAction(opid: string) {
    const element = this.collectAutofillContentService.getAutofillFieldElementByOpid(opid);
    this.triggerClickOnElement(element);
  }

  /**
   * Handles finding an element by opid and triggering click and focus events on the element.
   * @param {string} opid
   * @private
   */
  private handleFocusOnFieldByOpidAction(opid: string) {
    const element = this.collectAutofillContentService.getAutofillFieldElementByOpid(opid);
    this.simulateUserMouseClickAndFocusEventInteractions(element, true);
  }

  private insertValueIntoField(element: FormFieldElement, value: string) {
    const elementCanBeReadonly =
      element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
    const elementCanBeFilled = elementCanBeReadonly || element instanceof HTMLSelectElement;

    if (
      !element ||
      !value ||
      (elementCanBeReadonly && element.readOnly) ||
      (elementCanBeFilled && element.disabled)
    ) {
      return;
    }

    if (element instanceof HTMLSpanElement) {
      this.handleInsertValueAndTriggerSimulatedEvents(element, () => (element.innerText = value));
      return;
    }

    const isFillableCheckboxOrRadioElement =
      element instanceof HTMLInputElement &&
      new Set(["checkbox", "radio"]).has(element.type) &&
      new Set(["true", "y", "1", "yes", "✓"]).has(String(value).toLowerCase());
    if (isFillableCheckboxOrRadioElement) {
      this.handleInsertValueAndTriggerSimulatedEvents(element, () => (element.checked = true));
      return;
    }

    this.handleInsertValueAndTriggerSimulatedEvents(element, () => (element.value = value));
  }

  private handleInsertValueAndTriggerSimulatedEvents(
    element: FormFieldElement,
    valueChangeCallback: CallableFunction
  ): void {
    this.triggerPreInsertEventsOnElement(element);
    valueChangeCallback();
    this.triggerPostInsertEventsOnElement(element);
    this.triggerFillAnimationOnElement(element);
  }

  /**
   * Simulates a mouse click event on the element, including focusing the event, and
   * the triggers a simulated keyboard event on the element. Will attempt to ensure
   * that the initial element value is not arbitrarily changed by the simulated events.
   * @param {FormFieldElement} element
   * @private
   */
  private triggerPreInsertEventsOnElement(element: FormFieldElement): void {
    const initialElementValue = "value" in element ? element.value : "";

    this.simulateUserMouseClickAndFocusEventInteractions(element);
    this.simulateUserKeyboardEventInteractions(element);

    if ("value" in element && initialElementValue !== element.value) {
      element.value = initialElementValue;
    }
  }

  /**
   * Simulates a keyboard event on the element before assigning the autofilled value to the element, and then
   * simulates an input change event on the element to trigger expected events after autofill occurs.
   * @param {FormFieldElement} element
   * @private
   */
  private triggerPostInsertEventsOnElement(element: FormFieldElement): void {
    const autofilledValue = "value" in element ? element.value : "";
    this.simulateUserKeyboardEventInteractions(element);

    if ("value" in element && autofilledValue !== element.value) {
      element.value = autofilledValue;
    }

    this.simulateInputElementChangedEvent(element);
    element.blur();
  }

  private triggerFillAnimationOnElement(element: FormFieldElement): void {
    const skipAnimatingElement =
      !(element instanceof HTMLSpanElement) &&
      !new Set(["email", "text", "password", "number", "tel", "url"]).has(element?.type);

    if (this.formFieldVisibilityService.isFieldHiddenByCss(element) || skipAnimatingElement) {
      return;
    }

    element.classList.add("com-bitwarden-browser-animated-fill");
    setTimeout(() => element.classList.remove("com-bitwarden-browser-animated-fill"), 200);
  }

  private triggerClickOnElement(element?: HTMLElement): void {
    if (typeof element?.click !== TYPE_CHECK.FUNCTION) {
      return;
    }

    element.click();
  }

  private triggerFocusOnElement(element: HTMLElement | undefined, shouldResetValue = false): void {
    if (typeof element?.focus !== TYPE_CHECK.FUNCTION) {
      return;
    }

    let initialValue = "";
    if (shouldResetValue && "value" in element) {
      initialValue = String(element.value);
    }

    element.focus();

    if (initialValue && "value" in element) {
      element.value = initialValue;
    }
  }

  private simulateUserMouseClickAndFocusEventInteractions(
    element: FormFieldElement,
    shouldResetValue = false
  ): void {
    this.triggerClickOnElement(element);
    this.triggerFocusOnElement(element, shouldResetValue);
  }

  private simulateUserKeyboardEventInteractions(element: FormFieldElement): void {
    [EVENTS.KEYDOWN, EVENTS.KEYPRESS, EVENTS.KEYUP].forEach((eventType) =>
      element.dispatchEvent(new KeyboardEvent(eventType, { bubbles: true }))
    );
  }

  private simulateInputElementChangedEvent(element: FormFieldElement): void {
    [EVENTS.INPUT, EVENTS.CHANGE].forEach((eventType) =>
      element.dispatchEvent(new Event(eventType, { bubbles: true }))
    );
  }
}

export default InsertAutofillContentService;

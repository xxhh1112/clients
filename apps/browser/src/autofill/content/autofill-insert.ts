import { TYPE_CHECK } from "../constants";
import AutofillScript, { AutofillInsertActions, FillScript } from "../models/autofill-script";
import AutofillFieldVisibilityService from "../services/autofill-field-visibility.service";
import { FillableControl, FormElement } from "../types";
import { canSeeElementToStyle, setValueForElement, setValueForElementByEvent } from "../utils";

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
    const styleTimeout = 200;
    setValueForElement(element as FillableControl);
    callback(element);
    setValueForElementByEvent(element as FillableControl);

    if (canSeeElementToStyle(element, true)) {
      element.classList.add("com-bitwarden-browser-animated-fill");

      setTimeout(function () {
        if (element) {
          element.classList.remove("com-bitwarden-browser-animated-fill");
        }
      }, styleTimeout);
    }
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
}

export default AutofillInsert;

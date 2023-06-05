import AutofillScript, { AutofillInsertActions, FillScript } from "../models/autofill-script";
import { FillableControl } from "../types";
import {
  canSeeElementToStyle,
  doClickByOpId,
  doFocusByOpId,
  getElementByOpId,
  setValueForElement,
  setValueForElementByEvent,
} from "../utils";

class AutofillInsert {
  private delayActionsInMilliseconds = 20;
  private readonly autofillInsertActions: AutofillInsertActions = {
    fill_by_opid: ({ opid, value }) => this.fillFieldByOpid(opid, value),
    click_on_opid: ({ opid }) => this.clickOnFieldByOpid(opid),
    focus_by_opid: ({ opid }) => this.focusOnFieldByOpid(opid),
  };

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

    setTimeout(
      () => this.autofillInsertActions[action]({ opid, value }),
      this.delayActionsInMilliseconds * actionIndex
    );
  };

  private fillFieldByOpid(opid: string, value: string) {
    const element = getElementByOpId(opid);
    this.insertValueIntoField(element, value);
  }

  private clickOnFieldByOpid(opid: string) {
    doClickByOpId(opid);
  }

  private focusOnFieldByOpid(opid: string) {
    doFocusByOpId(opid);
  }

  private insertValueIntoField(element: HTMLElement, value: string) {
    const unknownElementType = element as any;
    if (
      !element ||
      !value ||
      // TODO - Need these elements to be typed more specifically
      unknownElementType.disabled ||
      unknownElementType.a || // Ok seriously, what is this? Why is this here?
      unknownElementType.readOnly
    ) {
      return;
    }

    const elementType = unknownElementType.type;

    const shouldFillCheckboxAndRadioElements = new Set(["true", "y", "1", "yes", "✓"]).has(
      String(value).toLowerCase()
    );
    if (elementType === "checkbox") {
      if ((unknownElementType as HTMLInputElement).checked === shouldFillCheckboxAndRadioElements) {
        return;
      }

      this.doAllFillOperations(unknownElementType, function (theElement: any) {
        theElement.checked = true;
      });

      return;
    }

    if (elementType === "radio" && shouldFillCheckboxAndRadioElements) {
      unknownElementType.click();

      return;
    }

    if (unknownElementType.value == value) {
      return;
    }

    this.doAllFillOperations(unknownElementType, function (theElement: any) {
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

  private doAllFillOperations(element: FillableControl, callback: CallableFunction): void {
    const styleTimeout = 200;
    setValueForElement(element);
    callback(element);
    setValueForElementByEvent(element);

    if (canSeeElementToStyle(element, true)) {
      element.classList.add("com-bitwarden-browser-animated-fill");

      setTimeout(function () {
        if (element) {
          element.classList.remove("com-bitwarden-browser-animated-fill");
        }
      }, styleTimeout);
    }
  }
}

export default AutofillInsert;

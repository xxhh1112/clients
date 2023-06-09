/*
  1Password Extension

  Lovingly handcrafted by Dave Teare, Michael Fey, Rad Azzouz, and Roustem Karimov.
  Copyright (c) 2014 AgileBits. All rights reserved.

  ================================================================================

  Copyright (c) 2014 AgileBits Inc.

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
  */

import { TYPE_CHECK } from "../constants";
import AutofillForm from "../models/autofill-form";
import AutofillPageDetails from "../models/autofill-page-details";
import AutofillScript, {
  /** DEAD CODE */
  // AutofillScriptOptions,
  /** END DEAD CODE **/
  FillScript,
  FillScriptActions,
} from "../models/autofill-script";
import {
  /** DEAD CODE ?? **/
  // AutofillDocument,
  /** END DEAD CODE **/
  ElementWithOpId,
  FillableControl,
  FormFieldElement,
} from "../types";
import {
  // collect utils
  canSeeElementToStyle,
  getInnerText,
  getPropertyOrAttribute,
  getElementByOpId,
  getElementValue,
  getFormElements,
  getLabelTop,
  getSelectElementOptions,
  isElementViewable,
  isNewSectionTag,
  queryDocument,
  /** DEAD CODE - This isn't being used and should be deprecated */
  // isElementVisible,
  // selectAllFromDoc,
  /** END DEAD CODE **/
  getAdjacentElementLabelValues,
  toLowerString,

  // fill utils
  addProperty,
  doClickByOpId,
  doFocusByOpId,
  setValueForElement,
  setValueForElementByEvent,
  urlNotSecure,
  /** DEAD CODE */
  // doClickByQuery,
  // doSimpleSetByQuery,
  // touchAllPasswordFields,
  /** END DEAD CODE **/
} from "../utils";

function collect(document: Document) {
  /** DEAD CODE **/
  // const isFirefox =
  //   navigator.userAgent.indexOf("Firefox") !== -1 || navigator.userAgent.indexOf("Gecko/") !== -1;
  /** END DEAD CODE  **/

  /** DEAD CODE **/
  // (document as AutofillDocument).elementsByOPID = {};
  /** END DEAD CODE **/

  /** DEAD CODE */
  /**
   * Do the event on the element.
   * @param {HTMLElement} kedol The element to do the event on
   * @param {string} fonor The event name
   * @returns
   */

  // function doEventOnElement(kedol: HTMLElement, fonor: string) {
  //   let quebo: any;
  //   isFirefox
  //     ? ((quebo = document.createEvent(EVENTS.KEYBOARDEVENT)),
  //       quebo.initKeyEvent(fonor, true, false, null, false, false, false, false, 0, 0))
  //     : ((quebo = kedol.ownerDocument.createEvent("Events")),
  //       quebo.initEvent(fonor, true, false),
  //       (quebo.charCode = 0),
  //       (quebo.keyCode = 0),
  //       (quebo.which = 0),
  //       (quebo.srcElement = kedol),
  //       (quebo.target = kedol));
  //
  //   return quebo;
  // }
  /** END DEAD CODE **/

  function getPageDetails(theDoc: Document, oneShotId: string) {
    /**
     * Get the contents of the elements that are labels for `el`
     * @param {HTMLElement} el
     * @returns {string} A string containing all of the `innerText` or `textContent` values for all elements that are labels for `el`
     */
    function getLabelTag(el: FillableControl): string | null {
      let docLabel: HTMLElement[],
        theLabels: HTMLElement[] = [];
      let theEl: HTMLElement = el;

      if (el.labels && el.labels.length && 0 < el.labels.length) {
        theLabels = Array.prototype.slice.call(el.labels);
      } else {
        if (el.id) {
          theLabels = theLabels.concat(
            Array.prototype.slice.call(
              queryDocument(theDoc, "label[for=" + JSON.stringify(el.id) + "]")
            )
          );
        }

        if (el.name) {
          docLabel = queryDocument(theDoc, "label[for=" + JSON.stringify(el.name) + "]");

          for (let labelIndex = 0; labelIndex < docLabel.length; labelIndex++) {
            if (-1 === theLabels.indexOf(docLabel[labelIndex])) {
              theLabels.push(docLabel[labelIndex]);
            }
          }
        }

        for (; theEl && theEl != (theDoc as any); theEl = theEl.parentNode as HTMLElement) {
          if (
            toLowerString(theEl.tagName) === "label" &&
            -1 === theLabels.indexOf(theEl as HTMLLabelElement)
          ) {
            theLabels.push(theEl as HTMLLabelElement);
          }
        }
      }

      if (0 === theLabels.length) {
        theEl = el.parentNode as HTMLLabelElement;
        if (
          theEl.tagName.toLowerCase() === "dd" &&
          theEl.previousElementSibling !== null &&
          theEl.previousElementSibling.tagName.toLowerCase() === "dt"
        ) {
          theLabels.push(theEl.previousElementSibling as HTMLLabelElement);
        }
      }

      if (0 > theLabels.length) {
        return null;
      }

      return theLabels
        .map(function (l) {
          return (l.textContent || l.innerText)
            .replace(/^\\s+/, "")
            .replace(/\\s+$/, "")
            .replace("\\n", "")
            .replace(/\\s{2,}/, " ");
        })
        .join("");
    }

    const theView = theDoc.defaultView ? theDoc.defaultView : window;

    // get all the docs
    const theForms: AutofillForm[] = Array.prototype.slice
      .call(queryDocument(theDoc, "form"))
      .map(function (formEl: HTMLFormElement, elIndex: number) {
        const op: AutofillForm = {} as any;
        let formOpId: unknown = "__form__" + elIndex;

        (formEl as ElementWithOpId<HTMLFormElement>).opid = formOpId as string;
        op.opid = formOpId as string;
        addProperty(op, "htmlName", getPropertyOrAttribute(formEl, "name"));
        addProperty(op, "htmlID", getPropertyOrAttribute(formEl, "id"));
        formOpId = getPropertyOrAttribute(formEl, "action");
        formOpId = new URL(formOpId as string, window.location.href) as any;
        addProperty(op, "htmlAction", formOpId ? (formOpId as URL).href : null);
        addProperty(op, "htmlMethod", getPropertyOrAttribute(formEl, "method"));

        return op;
      });

    // get all the form fields
    const theFields = Array.prototype.slice
      .call(getFormElements(theDoc, 50))
      .map(function (el: FormFieldElement, elIndex: number) {
        const field: Record<string, any> = {};
        const opId = "__" + elIndex;
        let elMaxLen =
          (el as HTMLInputElement).maxLength == -1 ? 999 : (el as HTMLInputElement).maxLength;

        if (!elMaxLen || (typeof elMaxLen === TYPE_CHECK.NUMBER && isNaN(elMaxLen))) {
          elMaxLen = 999;
        }

        /** DEAD CODE */
        // (theDoc as AutofillDocument).elementsByOPID[opId] = el;
        /* END DEAD CODE **/
        (el as ElementWithOpId<FormFieldElement>).opid = opId;
        field.opid = opId;
        field.elementNumber = elIndex;
        addProperty(field, "maxLength", Math.min(elMaxLen, 999), 999);
        /** DEAD CODE - This isn't being used and should be deprecated */
        // field.visible = isElementVisible(el);
        /** END DEAD CODE **/
        field.viewable = isElementViewable(el);
        addProperty(field, "htmlID", getPropertyOrAttribute(el, "id"));
        addProperty(field, "htmlName", getPropertyOrAttribute(el, "name"));
        addProperty(field, "htmlClass", getPropertyOrAttribute(el, "class"));
        addProperty(field, "tabindex", getPropertyOrAttribute(el, "tabindex"));
        addProperty(field, "title", getPropertyOrAttribute(el, "title"));

        const elTagName = el.tagName.toLowerCase();
        addProperty(field, "tagName", elTagName);

        if (elTagName === "span") {
          return field;
        }

        if ("hidden" != toLowerString((el as FillableControl).type)) {
          addProperty(field, "label-tag", getLabelTag(el as FillableControl));
          addProperty(field, "label-data", getPropertyOrAttribute(el, "data-label"));
          addProperty(field, "label-aria", getPropertyOrAttribute(el, "aria-label"));
          addProperty(field, "label-top", getLabelTop(el));

          let labelArr: any = [];

          for (let sib: Node = el; sib && sib.nextSibling; ) {
            sib = sib.nextSibling;

            if (isNewSectionTag(sib)) {
              break;
            }

            getInnerText(labelArr, sib);
          }

          addProperty(field, "label-right", labelArr.join(""));
          labelArr = [];
          getAdjacentElementLabelValues(el, labelArr);
          labelArr = labelArr.reverse().join("");
          addProperty(field, "label-left", labelArr);
          addProperty(field, "placeholder", getPropertyOrAttribute(el, "placeholder"));
        }

        addProperty(field, "rel", getPropertyOrAttribute(el, "rel"));
        addProperty(field, "type", toLowerString(getPropertyOrAttribute(el, "type")));
        addProperty(field, "value", getElementValue(el));
        addProperty(field, "checked", (el as HTMLFormElement).checked, false);
        addProperty(
          field,
          "autoCompleteType",
          el.getAttribute("x-autocompletetype") ||
            el.getAttribute("autocompletetype") ||
            el.getAttribute("autocomplete"),
          "off"
        );
        addProperty(field, "disabled", (el as FillableControl).disabled);
        addProperty(field, "readonly", (el as any).b || (el as HTMLInputElement).readOnly);
        addProperty(
          field,
          "selectInfo",
          (el as HTMLSelectElement)?.options
            ? getSelectElementOptions(el as HTMLSelectElement)
            : null
        );
        addProperty(field, "aria-hidden", el.getAttribute("aria-hidden") == "true", false);
        addProperty(field, "aria-disabled", el.getAttribute("aria-disabled") == "true", false);
        addProperty(field, "aria-haspopup", el.getAttribute("aria-haspopup") == "true", false);
        addProperty(field, "data-stripe", getPropertyOrAttribute(el, "data-stripe"));
        /** DEAD CODE */
        // addProperty(field, "data-unmasked", el.dataset.unmasked);
        // addProperty(
        //   field,
        //   "onepasswordFieldType",
        //   el.dataset.onepasswordFieldType || (el as FillableControl).type
        // );
        // addProperty(field, "onepasswordDesignation", el.dataset.onepasswordDesignation);
        // addProperty(field, "onepasswordSignInUrl", el.dataset.onepasswordSignInUrl);
        // addProperty(field, "onepasswordSectionTitle", el.dataset.onepasswordSectionTitle);
        // addProperty(field, "onepasswordSectionFieldKind", el.dataset.onepasswordSectionFieldKind);
        // addProperty(field, "onepasswordSectionFieldTitle", el.dataset.onepasswordSectionFieldTitle);
        // addProperty(field, "onepasswordSectionFieldValue", el.dataset.onepasswordSectionFieldValue);
        /** END DEAD CODE */

        if ((el as FillableControl).form) {
          field.form = getPropertyOrAttribute((el as FillableControl).form, "opid");
        }

        return field;
      });

    /** DEAD CODE **/
    // // test form fields
    // theFields
    //   .filter(function (f: any) {
    //     return f.fakeTested;
    //   })
    //   .forEach(function (f: any) {
    //     const el = (theDoc as AutofillDocument).elementsByOPID[f.opid] as FillableControl;
    //     el.getBoundingClientRect();
    //
    //     const originalValue = el.value;
    //     // click it
    //     !el || (el && typeof el.click !== TYPE_CHECK.FUNCTION) || el.click();
    //     doFocusElement(el, false);
    //
    //     el.dispatchEvent(doEventOnElement(el, EVENTS.KEYDOWN));
    //     el.dispatchEvent(doEventOnElement(el, EVENTS.KEYPRESS));
    //     el.dispatchEvent(doEventOnElement(el, EVENTS.KEYUP));
    //
    //     el.value !== originalValue && (el.value = originalValue);
    //
    //     el.click && el.click();
    //     f.postFakeTestVisible = isElementVisible(el);
    //     f.postFakeTestViewable = isElementViewable(el);
    //     f.postFakeTestType = el.type;
    //
    //     const elValue = el.value;
    //
    //     const event1 = el.ownerDocument.createEvent(EVENTS.HTMLEVENTS),
    //       event2 = el.ownerDocument.createEvent(EVENTS.HTMLEVENTS);
    //     el.dispatchEvent(doEventOnElement(el, EVENTS.KEYDOWN));
    //     el.dispatchEvent(doEventOnElement(el, EVENTS.KEYPRESS));
    //     el.dispatchEvent(doEventOnElement(el, EVENTS.KEYUP));
    //     event2.initEvent(EVENTS.INPUT, true, true);
    //     el.dispatchEvent(event2);
    //     event1.initEvent(EVENTS.CHANGE, true, true);
    //     el.dispatchEvent(event1);
    //
    //     el.blur();
    //     el.value !== elValue && (el.value = elValue);
    //   });
    /** END DEAD CODE **/

    // build out the page details object. this is the final result
    const pageDetails: AutofillPageDetails = {
      /** DEAD CODE **/
      // documentUUID: oneShotId,
      /** END DEAD CODE **/
      title: theDoc.title,
      url: theView.location.href,
      documentUrl: theDoc.location.href,
      forms: (function (forms) {
        const formObj: { [id: string]: AutofillForm } = {};
        forms.forEach(function (f) {
          formObj[f.opid] = f;
        });
        return formObj;
      })(theForms),
      fields: theFields,
      collectedTimestamp: new Date().getTime(),
    };

    return pageDetails;
  }

  /** DEAD CODE ?? **/
  // (document as AutofillDocument).elementForOPID = getElementByOpId;
  /** END DEAD CODE **/

  return JSON.stringify(getPageDetails(document, "oneshotUUID"));
}

function fill(document: Document, fillScript: AutofillScript) {
  /** DEAD CODE - markTheFilling means nothing based on how we are currently referencing the variable */
  // const markTheFilling = true;
  // const animateTheFilling = true;
  /** END DEAD CODE */

  // Detect if within an iframe, and the iframe is sandboxed
  function isSandboxed() {
    // self.origin is 'null' if inside a frame with sandboxed csp or iframe tag
    return self.origin == null || self.origin === "null";
  }

  function doFill(fillScript: AutofillScript) {
    /** DEAD CODE - The fillScriptOptions aren't really being used for anything useful */
    // let fillScriptOps: AutofillScriptOptions | FillScript[]; // This variable is re-assigned and its type changes
    // let theOpIds: string[] = [];
    /** END DEAD CODE */
    const fillScriptProperties = fillScript.properties;
    let operationDelayMs = fillScript?.properties?.delay_between_operations || 1;
    /** DEAD CODE */
    // const operationsToDo: any[] = [];
    /** END DEAD CODE */

    fillScriptProperties &&
      fillScriptProperties.delay_between_operations &&
      (operationDelayMs = fillScriptProperties.delay_between_operations);

    if (isSandboxed() || urlNotSecure(fillScript.savedUrls)) {
      return;
    }

    if (fillScript.untrustedIframe) {
      // confirm() is blocked by sandboxed iframes, but we don't want to fill sandboxed iframes anyway.
      // If this occurs, confirm() returns false without displaying the dialog box, and autofill will be aborted.
      // The browser may print a message to the console, but this is not a standard error that we can handle.
      const confirmationWarning = [
        chrome.i18n.getMessage("autofillIframeWarning"),
        chrome.i18n.getMessage("autofillIframeWarningTip", [window.location.hostname]),
      ].join("\n\n");
      const acceptedIframeWarning = confirm(confirmationWarning);
      if (!acceptedIframeWarning) {
        return;
      }
    }

    /**
     * Performs all the operations specified in the `ops` FillScript array
     * @argument ops An array of FillScripts to execute
     * @argument theOperation A callback to execute after the operations are complete (this appears to be misnamed)
     */
    const doOperation = function (ops: FillScript[], theOperation: () => void): void {
      const op = ops[0];

      if (op === void 0) {
        theOperation();
      } else {
        /** DEAD CODE */
        // should we delay?
        // if ((op as any).operation === "delay" || op[0] === "delay") {
        //   operationDelayMs = (op as any).parameters ? (op as any).parameters[0] : op[1];
        // } else {
        //   if ((op = normalizeOp(op))) {
        //     for (let opIndex = 0; opIndex < op.length; opIndex++) {
        //       operationsToDo.indexOf(op[opIndex]) === -1 && operationsToDo.push(op[opIndex]);
        //     }
        //   }
        //
        //   theOpIds = theOpIds.concat(
        //     operationsToDo.map(function (operationToDo) {
        //       // eslint-disable-next-line no-prototype-builtins
        //       return operationToDo && operationToDo.hasOwnProperty("opid")
        //         ? operationToDo.opid
        //         : null;
        //     })
        //   );
        // }
        /** END DEAD CODE */

        normalizeOp(op);
        setTimeout(function () {
          doOperation(ops.slice(1), theOperation);
        }, operationDelayMs);
      }
    };

    /** DEAD CODE */
    // if ((fillScriptOps = fillScript.options)) {
    //   if (fillScriptOps.hasOwnProperty("animate") && fillScriptOps.animate) {
    //     animateTheFilling = fillScriptOps.animate;
    //   }
    //
    //    if (fillScriptOps.hasOwnProperty("markFilling") && fillScriptOps.markFilling) {
    //      markTheFilling = fillScriptOps.markFilling;
    //    }
    //  }
    //
    // don't mark a password filling
    // fillScript.itemType && "fillPassword" === fillScript.itemType && (markTheFilling = false);
    /** END DEAD CODE */

    // eslint-disable-next-line no-prototype-builtins
    if (!fillScript.hasOwnProperty("script")) {
      return;
    }

    // custom fill script

    /** DEAD CODE */
    // fillScriptOps = fillScript.script;
    /** END DEAD CODE */
    doOperation(fillScript.script, function () {
      // Done now
      // Removed autosubmit logic because we don't use it and it relied on undeclared variables
      // Removed protectedGlobalPage logic because it relied on undeclared variables
    });
  }

  /**
   * This contains all possible FillScript operations, which matches the FillScriptActions enum. We only use some of them.
   * This is accessed by indexing on the FillScriptActions, e.g. thisFill[FillScriptActions].
   */
  const thisFill: Record<FillScriptActions | string, any> = {
    fill_by_opid: doFillByOpId,
    click_on_opid: doClickByOpId,
    focus_by_opid: doFocusByOpId,
    /** DEAD CODE - We never use this */
    // fill_by_query: doFillByQuery,
    // click_on_query: doClickByQuery,
    // touch_all_fields: touchAllPasswordFields,
    // simple_set_value_by_query: doSimpleSetByQuery,
    // delay: null,
    /** END DEAD CODE */
  };

  /**
   * Performs the operation specified by the FillScript
   */
  function normalizeOp(op: FillScript) {
    let thisOperation: FillScriptActions;

    /** DEAD CODE */
    // If the FillScript is an object - unused
    // eslint-disable-next-line no-prototype-builtins
    // if (op.hasOwnProperty("operation") && op.hasOwnProperty("parameters")) {
    //   (thisOperation = (op as any).operation), (op = (op as any).parameters);
    // } else {
    //   // If the FillScript is an array - this is what we use
    //   if ("[object Array]" === Object.prototype.toString.call(op)) {
    //     (thisOperation = op[0]), ((op as any) = op.splice(1));
    //   } else {
    //     return null;
    //   }
    // }
    /** END DEAD CODE */

    if ("[object Array]" === Object.prototype.toString.call(op)) {
      (thisOperation = op[0]), ((op as any) = op.splice(1));
    } else {
      return null;
    }

    // eslint-disable-next-line no-prototype-builtins
    return thisFill.hasOwnProperty(thisOperation) ? thisFill[thisOperation].apply(this, op) : null;
  }

  // do a fill by opid operation
  function doFillByOpId(opId: string, op: string) {
    const el = getElementByOpId(opId) as FillableControl;

    return el ? (fillTheElement(el, op), [el]) : null;
  }

  /** DEAD CODE */
  // /**
  //  * Find all elements matching `query` and fill them using the value `op` from the fill script
  //  */
  // function doFillByQuery(query: string, op: string): FillableControl[] {
  //   const elements = Array.from(selectAllFromDoc(query)) as HTMLInputElement[];
  //
  //   return elements.map((el: FillableControl) => {
  //     fillTheElement(el, op);
  //
  //     return el;
  //   });
  // }
  /** END DEAD CODE */

  const checkRadioTrueOps: Record<string, boolean> = {
      true: true,
      y: true,
      1: true,
      yes: true,
      "✓": true,
    },
    styleTimeout = 200;

  /**
   * Fill an element `el` using the value `op` from the fill script
   * @param {HTMLElement} el
   * @param {string} op
   */
  function fillTheElement(el: FillableControl, op: string) {
    let shouldCheck: boolean;

    if (
      el &&
      null !== op &&
      void 0 !== op &&
      !(el.disabled || (el as any).a || (el as HTMLInputElement).readOnly)
    ) {
      switch (
        /** DEAD CODE */
        // markTheFilling &&
        // (el.form && !el.form.opfilled && (el.form.opfilled = true),
        /** END DEAD CODE */
        el.type ? el.type.toLowerCase() : null
      ) {
        case "checkbox":
          shouldCheck = !!(
            op &&
            op.length >= 1 &&
            // eslint-disable-next-line no-prototype-builtins
            checkRadioTrueOps.hasOwnProperty(op.toLowerCase()) &&
            checkRadioTrueOps[op.toLowerCase()]
          );

          (el as HTMLInputElement).checked === shouldCheck ||
            doAllFillOperations(el, function (theEl) {
              (theEl as HTMLInputElement).checked = shouldCheck;
            });

          break;
        case "radio":
          checkRadioTrueOps[op.toLowerCase()] === true && el.click();

          break;
        default:
          el.value == op ||
            doAllFillOperations(el, function (theEl) {
              if (!theEl.type && theEl.tagName.toLowerCase() === "span") {
                theEl.innerText = op;

                return;
              }

              theEl.value = op;
            });
      }
    }
  }

  /**
   * Do all the fill operations needed on the element `el`.
   * @param {HTMLElement} el
   * @param {*} afterValSetFunc The function to perform after the operations are complete.
   */
  function doAllFillOperations(
    el: FillableControl,
    afterValSetFunc: (el: FillableControl) => void
  ) {
    setValueForElement(el);
    afterValSetFunc(el);
    setValueForElementByEvent(el);

    // if (canSeeElementToStyle(el, animateTheFilling)) {
    if (canSeeElementToStyle(el, true)) {
      el.classList.add("com-bitwarden-browser-animated-fill");

      setTimeout(function () {
        if (el) {
          el.classList.remove("com-bitwarden-browser-animated-fill");
        }
      }, styleTimeout);
    }
  }

  /** DEAD CODE ?? **/
  // (document as AutofillDocument).elementForOPID = getElementByOpId;
  /** END DEAD CODE **/

  doFill(fillScript);

  return JSON.stringify({
    success: true,
  });
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.command === "collectPageDetails") {
    const pageDetails = collect(document);
    const pageDetailsObj: AutofillPageDetails = JSON.parse(pageDetails);

    chrome.runtime.sendMessage({
      command: "collectPageDetailsResponse",
      tab: msg.tab,
      details: pageDetailsObj,
      sender: msg.sender,
    });

    sendResponse();

    return true;
  } else if (msg.command === "fillForm") {
    fill(document, msg.fillScript);
    sendResponse();

    return true;
  } else if (msg.command === "collectPageDetailsImmediately") {
    const pageDetails = collect(document);
    const pageDetailsObj: AutofillPageDetails = JSON.parse(pageDetails);

    sendResponse(pageDetailsObj);

    return true;
  }
});

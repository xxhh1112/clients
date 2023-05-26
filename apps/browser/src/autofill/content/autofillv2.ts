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

import {
  // EVENTS,
  TYPE_CHECK,
} from "../constants";
import AutofillForm from "../models/autofill-form";
import AutofillPageDetails from "../models/autofill-page-details";
import AutofillScript, {
  AutofillScriptOptions,
  FillScript,
  FillScriptOp,
} from "../models/autofill-script";
import { AutofillDocument, ElementWithOpId, FillableControl, FormElement } from "../types";
import {
  // collect utils
  addProp,
  checkNodeType,
  // focusElement,
  getElementAttrValue,
  getElementForOPID,
  getElementValue,
  getFormElements,
  getLabelTop,
  getSelectElementOptions,
  isElementViewable,
  isElementVisible,
  isKnownTag,
  queryDoc,
  shiftForLeftLabel,
  toLowerString,

  // fill utils
  urlNotSecure,
  canSeeElementToStyle,
  selectAllFromDoc,
  getElementByOpId,
  setValueForElementByEvent,
  setValueForElement,
  doClickByOpId,
  touchAllFields,
  doClickByQuery,
  doFocusByOpId,
  doSimpleSetByQuery,
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
      let docLabel: HTMLLabelElement[],
        theLabels: HTMLLabelElement[] = [];
      let theEl: HTMLElement = el;

      if (el.labels && el.labels.length && 0 < el.labels.length) {
        theLabels = Array.prototype.slice.call(el.labels);
      } else {
        if (el.id) {
          theLabels = theLabels.concat(
            Array.prototype.slice.call(
              queryDoc<HTMLLabelElement>(theDoc, "label[for=" + JSON.stringify(el.id) + "]")
            )
          );
        }

        if (el.name) {
          docLabel = queryDoc<HTMLLabelElement>(
            theDoc,
            "label[for=" + JSON.stringify(el.name) + "]"
          );

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
      .call(queryDoc<HTMLFormElement>(theDoc, "form"))
      .map(function (formEl: HTMLFormElement, elIndex: number) {
        const op: AutofillForm = {} as any;
        let formOpId: unknown = "__form__" + elIndex;

        (formEl as ElementWithOpId<HTMLFormElement>).opid = formOpId as string;
        op.opid = formOpId as string;
        addProp(op, "htmlName", getElementAttrValue(formEl, "name"));
        addProp(op, "htmlID", getElementAttrValue(formEl, "id"));
        formOpId = getElementAttrValue(formEl, "action");
        formOpId = new URL(formOpId as string, window.location.href) as any;
        addProp(op, "htmlAction", formOpId ? (formOpId as URL).href : null);
        addProp(op, "htmlMethod", getElementAttrValue(formEl, "method"));

        return op;
      });

    // get all the form fields
    const theFields = Array.prototype.slice
      .call(getFormElements(theDoc, 50))
      .map(function (el: FormElement, elIndex: number) {
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
        (el as ElementWithOpId<FormElement>).opid = opId;
        field.opid = opId;
        field.elementNumber = elIndex;
        addProp(field, "maxLength", Math.min(elMaxLen, 999), 999);
        field.visible = isElementVisible(el);
        field.viewable = isElementViewable(el);
        addProp(field, "htmlID", getElementAttrValue(el, "id"));
        addProp(field, "htmlName", getElementAttrValue(el, "name"));
        addProp(field, "htmlClass", getElementAttrValue(el, "class"));
        addProp(field, "tabindex", getElementAttrValue(el, "tabindex"));
        addProp(field, "title", getElementAttrValue(el, "title"));

        const elTagName = el.tagName.toLowerCase();
        addProp(field, "tagName", elTagName);

        if (elTagName === "span") {
          return field;
        }

        if ("hidden" != toLowerString((el as FillableControl).type)) {
          addProp(field, "label-tag", getLabelTag(el as FillableControl));
          addProp(field, "label-data", getElementAttrValue(el, "data-label"));
          addProp(field, "label-aria", getElementAttrValue(el, "aria-label"));
          addProp(field, "label-top", getLabelTop(el));

          let labelArr: any = [];

          for (let sib: Node = el; sib && sib.nextSibling; ) {
            sib = sib.nextSibling;

            if (isKnownTag(sib)) {
              break;
            }

            checkNodeType(labelArr, sib);
          }

          addProp(field, "label-right", labelArr.join(""));
          labelArr = [];
          shiftForLeftLabel(el, labelArr);
          labelArr = labelArr.reverse().join("");
          addProp(field, "label-left", labelArr);
          addProp(field, "placeholder", getElementAttrValue(el, "placeholder"));
        }

        addProp(field, "rel", getElementAttrValue(el, "rel"));
        addProp(field, "type", toLowerString(getElementAttrValue(el, "type")));
        addProp(field, "value", getElementValue(el));
        addProp(field, "checked", (el as HTMLFormElement).checked, false);
        addProp(
          field,
          "autoCompleteType",
          el.getAttribute("x-autocompletetype") ||
            el.getAttribute("autocompletetype") ||
            el.getAttribute("autocomplete"),
          "off"
        );
        addProp(field, "disabled", (el as FillableControl).disabled);
        addProp(field, "readonly", (el as any).b || (el as HTMLInputElement).readOnly);
        addProp(field, "selectInfo", getSelectElementOptions(el as HTMLSelectElement));
        addProp(field, "aria-hidden", el.getAttribute("aria-hidden") == "true", false);
        addProp(field, "aria-disabled", el.getAttribute("aria-disabled") == "true", false);
        addProp(field, "aria-haspopup", el.getAttribute("aria-haspopup") == "true", false);
        addProp(field, "data-stripe", getElementAttrValue(el, "data-stripe"));
        /** DEAD CODE */
        // addProp(field, "data-unmasked", el.dataset.unmasked);
        // addProp(
        //   field,
        //   "onepasswordFieldType",
        //   el.dataset.onepasswordFieldType || (el as FillableControl).type
        // );
        // addProp(field, "onepasswordDesignation", el.dataset.onepasswordDesignation);
        // addProp(field, "onepasswordSignInUrl", el.dataset.onepasswordSignInUrl);
        // addProp(field, "onepasswordSectionTitle", el.dataset.onepasswordSectionTitle);
        // addProp(field, "onepasswordSectionFieldKind", el.dataset.onepasswordSectionFieldKind);
        // addProp(field, "onepasswordSectionFieldTitle", el.dataset.onepasswordSectionFieldTitle);
        // addProp(field, "onepasswordSectionFieldValue", el.dataset.onepasswordSectionFieldValue);
        /** END DEAD CODE */

        if ((el as FillableControl).form) {
          field.form = getElementAttrValue((el as FillableControl).form, "opid");
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
    //     focusElement(el, false);
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
      documentUUID: oneShotId,
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

  (document as AutofillDocument).elementForOPID = getElementForOPID;

  return JSON.stringify(getPageDetails(document, "oneshotUUID"));
}

function fill(document: Document, fillScript: AutofillScript) {
  let markTheFilling = true;
  let animateTheFilling = true;

  // Detect if within an iframe, and the iframe is sandboxed
  function isSandboxed() {
    // self.origin is 'null' if inside a frame with sandboxed csp or iframe tag
    return self.origin == null || self.origin === "null";
  }

  function doFill(fillScript: AutofillScript) {
    let fillScriptOps: AutofillScriptOptions | FillScript[]; // This variable is re-assigned and its type changes
    let theOpIds: string[] = [];
    const fillScriptProperties = fillScript.properties;
    let operationDelayMs = 1;
    const operationsToDo: any[] = [];

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
      let op = ops[0];

      if (op === void 0) {
        theOperation();
      } else {
        // should we delay?
        if ((op as any).operation === "delay" || op[0] === "delay") {
          operationDelayMs = (op as any).parameters ? (op as any).parameters[0] : op[1];
        } else {
          if ((op = normalizeOp(op))) {
            for (let opIndex = 0; opIndex < op.length; opIndex++) {
              operationsToDo.indexOf(op[opIndex]) && operationsToDo.push(op[opIndex]) === -1;
            }
          }

          theOpIds = theOpIds.concat(
            operationsToDo.map(function (operationToDo) {
              // eslint-disable-next-line no-prototype-builtins
              return operationToDo && operationToDo.hasOwnProperty("opid")
                ? operationToDo.opid
                : null;
            })
          );
        }

        setTimeout(function () {
          doOperation(ops.slice(1), theOperation);
        }, operationDelayMs);
      }
    };

    if ((fillScriptOps = fillScript.options)) {
      // eslint-disable-next-line no-prototype-builtins
      if (fillScriptOps.hasOwnProperty("animate") && fillScriptOps.animate) {
        animateTheFilling = fillScriptOps.animate;
      }

      // eslint-disable-next-line no-prototype-builtins
      if (fillScriptOps.hasOwnProperty("markFilling") && fillScriptOps.markFilling) {
        markTheFilling = fillScriptOps.markFilling;
      }
    }

    // don't mark a password filling
    fillScript.itemType && "fillPassword" === fillScript.itemType && (markTheFilling = false);

    // eslint-disable-next-line no-prototype-builtins
    if (!fillScript.hasOwnProperty("script")) {
      return;
    }

    // custom fill script

    fillScriptOps = fillScript.script;
    doOperation(fillScriptOps, function () {
      // Done now
      // Removed autosubmit logic because we don't use it and it relied on undeclared variables
      // Removed protectedGlobalPage logic because it relied on undeclared variables
    });
  }

  /**
   * This contains all possible FillScript operations, which matches the FillScriptOp enum. We only use some of them.
   * This is accessed by indexing on the FillScriptOp, e.g. thisFill[FillScriptOp].
   */
  const thisFill: Record<FillScriptOp | string, any> = {
    fill_by_opid: doFillByOpId,
    fill_by_query: doFillByQuery,
    click_on_opid: doClickByOpId,
    click_on_query: doClickByQuery,
    touch_all_fields: touchAllFields,
    simple_set_value_by_query: doSimpleSetByQuery,
    focus_by_opid: doFocusByOpId,
    delay: null,
  };

  /**
   * Performs the operation specified by the FillScript
   */
  function normalizeOp(op: FillScript) {
    let thisOperation: FillScriptOp;

    // If the FillScript is an object - unused
    // eslint-disable-next-line no-prototype-builtins
    if (op.hasOwnProperty("operation") && op.hasOwnProperty("parameters")) {
      (thisOperation = (op as any).operation), (op = (op as any).parameters);
    } else {
      // If the FillScript is an array - this is what we use
      if ("[object Array]" === Object.prototype.toString.call(op)) {
        (thisOperation = op[0]), ((op as any) = op.splice(1));
      } else {
        return null;
      }
    }

    // eslint-disable-next-line no-prototype-builtins
    return thisFill.hasOwnProperty(thisOperation) ? thisFill[thisOperation].apply(this, op) : null;
  }

  // do a fill by opid operation
  function doFillByOpId(opId: string, op: string) {
    const el = getElementByOpId(opId) as FillableControl;

    return el ? (fillTheElement(el, op), [el]) : null;
  }

  /**
   * Find all elements matching `query` and fill them using the value `op` from the fill script
   */
  function doFillByQuery(query: string, op: string): FillableControl[] {
    const elements = selectAllFromDoc(query);

    return Array.prototype.map.call(
      Array.prototype.slice.call(elements),
      function (el: FillableControl) {
        fillTheElement(el, op);

        return el;
      },
      this
    );
  }

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
        (markTheFilling && el.form && !el.form.opfilled && (el.form.opfilled = true),
        el.type ? el.type.toLowerCase() : null)
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

    if (canSeeElementToStyle(el, animateTheFilling)) {
      el.classList.add("com-bitwarden-browser-animated-fill");

      setTimeout(function () {
        if (el) {
          el.classList.remove("com-bitwarden-browser-animated-fill");
        }
      }, styleTimeout);
    }
  }

  (document as AutofillDocument).elementForOPID = getElementByOpId;

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

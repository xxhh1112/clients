import { FillableControl, ElementWithOpId, FormElement } from "../types";

/**
 * Clean up the string `s` to remove non-printable characters and whitespace.
 * @param {string} s
 * @returns {string} Clean text
 */
function cleanText(s: string | null): string | null {
  let sVal: string | null = null;
  s && ((sVal = s.replace(/^\\s+|\\s+$|\\r?\\n.*$/gm, "")), (sVal = 0 < sVal.length ? sVal : null));

  return sVal;
}

/**
 * If `el` is a text node, add the node's text to `arr`.
 * If `el` is an element node, add the element's `textContent or `innerText` to `arr`.
 * @param {string[]} arr An array of `textContent` or `innerText` values
 * @param {HTMLElement} el The element to push to the array
 */
export function checkNodeType(arr: string[], el: Node) {
  let theText: string | Node["nodeValue"] = "";

  3 === el.nodeType
    ? (theText = el.nodeValue)
    : 1 === el.nodeType && (theText = el.textContent || (el as HTMLElement).innerText);

  (theText = cleanText(theText)) && arr.push(theText);
}

/**
 * Check if `el` is a type that indicates the transition to a new section of the page.
 * If so, this indicates that we should not use `el` or its children for getting autofill context for the previous element.
 * @param {HTMLElement} el The element to check
 * @returns {boolean} Returns `true` if `el` is an HTML element from a known set and `false` otherwise
 */
export function isKnownTag(el: any) {
  if (el && void 0 !== el) {
    const tags = [
      "body",
      "button",
      "form",
      "head",
      "iframe",
      "input",
      "option",
      "script",
      "select",
      "table",
      "textarea",
    ];

    if (el) {
      const elTag = el ? (el.tagName || "").toLowerCase() : "";

      return tags.constructor == Array ? 0 <= tags.indexOf(elTag) : elTag === tags;
    } else {
      return false;
    }
  } else {
    return true;
  }
}

/**
 * Recursively gather all of the text values from the elements preceding `el` in the DOM
 * @param {HTMLElement} el
 * @param {string[]} arr An array of `textContent` or `innerText` values
 * @param {number} steps The number of steps to take up the DOM tree
 */
export function shiftForLeftLabel(el: any, arr: string[], steps?: number) {
  let sib;

  for (steps || (steps = 0); el && el.previousSibling; ) {
    el = el.previousSibling;

    if (isKnownTag(el)) {
      return;
    }

    checkNodeType(arr, el);
  }

  if (el && 0 === arr.length) {
    for (sib = null; !sib; ) {
      el = el.parentElement || el.parentNode;

      if (!el) {
        return;
      }

      for (sib = el.previousSibling; sib && !isKnownTag(sib) && sib.lastChild; ) {
        sib = sib.lastChild;
      }
    }

    // base case and recurse
    isKnownTag(sib) ||
      (checkNodeType(arr, sib), 0 === arr.length && shiftForLeftLabel(sib, arr, steps + 1));
  }
}

/**
 * Determine if the element is visible.
 * Visible is define as not having `display: none` or `visibility: hidden`.
 * @param {HTMLElement} el
 * @returns {boolean} Returns `true` if the element is visible and `false` otherwise
 */
export function isElementVisible(el: any) {
  let theEl = el;
  // Get the top level document
  // eslint-disable-next-line no-cond-assign
  el = (el = el.ownerDocument) ? el.defaultView : {};

  // walk the dom tree until we reach the top
  for (let elStyle; theEl && theEl !== document; ) {
    // Calculate the style of the element
    elStyle = el.getComputedStyle ? el.getComputedStyle(theEl, null) : theEl.style;

    // If there's no computed style at all, we're done, as we know that it's not hidden
    if (!elStyle) {
      return true;
    }

    // If the element's computed style includes `display: none` or `visibility: hidden`, we know it's hidden
    if ("none" === elStyle.display || "hidden" == elStyle.visibility) {
      return false;
    }

    // At this point, we aren't sure if the element is hidden or not, so we need to keep walking up the tree
    theEl = theEl.parentNode;
  }

  return theEl === document;
}

/**
 * Determine if the element is "viewable" on the screen.
 * "Viewable" is defined as being visible in the DOM and being within the confines of the viewport.
 * @param {HTMLElement} el
 * @returns {boolean} Returns `true` if the element is viewable and `false` otherwise
 */
export function isElementViewable(el: FormElement) {
  const theDoc = el.ownerDocument.documentElement;
  const rect = el.getBoundingClientRect(); // getBoundingClientRect is relative to the viewport
  const docScrollWidth = theDoc.scrollWidth; // scrollWidth is the width of the document including any overflow
  const docScrollHeight = theDoc.scrollHeight; // scrollHeight is the height of the document including any overflow
  const leftOffset = rect.left - theDoc.clientLeft; // How far from the left of the viewport is the element, minus the left border width?
  const topOffset = rect.top - theDoc.clientTop; // How far from the top of the viewport is the element, minus the top border width?
  let theRect;

  if (!isElementVisible(el) || !el.offsetParent || 10 > el.clientWidth || 10 > el.clientHeight) {
    return false;
  }

  const rects = el.getClientRects();

  if (0 === rects.length) {
    return false;
  }

  // If any of the rects have a left side that is further right than the document width or a right side that is
  // further left than the origin (i.e. is negative), we consider the element to be not viewable
  for (let i = 0; i < rects.length; i++) {
    if (((theRect = rects[i]), theRect.left > docScrollWidth || 0 > theRect.right)) {
      return false;
    }
  }

  // If the element is further left than the document width, or further down than the document height, we know that it's not viewable
  if (
    0 > leftOffset ||
    leftOffset > docScrollWidth ||
    0 > topOffset ||
    topOffset > docScrollHeight
  ) {
    return false;
  }

  // Our next check is going to get the center point of the element, and then use elementFromPoint to see if the element
  // is actually returned from that point. If it is, we know that it's viewable. If it isn't, we know that it's not viewable.
  // If the right side of the bounding rectangle is outside the viewport, the x coordinate of the center point is the window width (minus offset) divided by 2.
  // If the right side of the bounding rectangle is inside the viewport, the x coordinate of the center point is the width of the bounding rectangle divided by 2.
  // If the bottom of the bounding rectangle is outside the viewport, the y coordinate of the center point is the window height (minus offset) divided by 2.
  // If the bottom side of the bounding rectangle is inside the viewport, the y coordinate of the center point is the height of the bounding rectangle divided by
  // We then use elementFromPoint to find the element at that point.
  let pointEl = el.ownerDocument.elementFromPoint(
    leftOffset +
      (rect.right > window.innerWidth ? (window.innerWidth - leftOffset) / 2 : rect.width / 2),
    topOffset +
      (rect.bottom > window.innerHeight ? (window.innerHeight - topOffset) / 2 : rect.height / 2)
  );

  for (; pointEl && pointEl !== el && pointEl !== (document as unknown as Element); ) {
    // If the element we found is a label, and the element we're checking has labels
    if (
      pointEl.tagName &&
      "string" === typeof pointEl.tagName &&
      "label" === pointEl.tagName.toLowerCase() &&
      (el as FillableControl).labels &&
      0 < ((el as FillableControl).labels?.length || 0)
    ) {
      // Return true if the element we found is one of the labels for the element we're checking.
      // This means that the element we're looking for is considered viewable
      return 0 <= Array.prototype.slice.call((el as FillableControl).labels).indexOf(pointEl);
    }

    // Walk up the DOM tree to check the parent element
    pointEl = pointEl.parentNode as Element;
  }

  // If the for loop exited because we found the element we're looking for, return true, as it's viewable
  // If the element that we found isn't the element we're looking for, it means the element we're looking for is not viewable
  return pointEl === el;
}

/**
 * Retrieve the element from the document with the specified `opid` property
 * @param {number} opId
 * @returns {HTMLElement} The element with the specified `opiId`, or `null` if no such element exists
 */
export function getElementForOPID(opId: string): Element | null {
  let theEl;

  if (void 0 === opId || null === opId) {
    return null;
  }

  try {
    const formEls = Array.prototype.slice.call(getFormElements(document));
    const filteredFormEls = formEls.filter(function (el: ElementWithOpId<FormElement>) {
      return el.opid == opId;
    });

    if (0 < filteredFormEls.length) {
      (theEl = filteredFormEls[0]),
        // eslint-disable-next-line no-console
        1 < filteredFormEls.length && console.warn(`More than one element found with opid ${opId}`);
    } else {
      const theIndex = parseInt(opId.split("__")[1], 10);

      isNaN(theIndex) || (theEl = formEls[theIndex]);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`An unexpected error occurred: ${e}`);
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    return theEl;
  }
}

/**
 * Query `theDoc` for form elements that we can use for autofill, ranked by importance and limited by `limit`
 * @param {Document} theDoc The Document to query
 * @param {number} limit The maximum number of elements to return
 * @returns An array of HTMLElements
 */
export function getFormElements(theDoc: Document, limit?: number): FormElement[] {
  let els: FormElement[] = [];

  try {
    const elsList = theDoc.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="reset"])' +
        ':not([type="button"]):not([type="image"]):not([type="file"]):not([data-bwignore]), select, textarea, ' +
        "span[data-bwautofill]"
    );
    els = Array.prototype.slice.call(elsList);
  } catch (e) {
    /* no-op */
  }

  if (!limit || els.length <= limit) {
    return els;
  }

  // non-checkboxes/radios have higher priority
  let returnEls: FormElement[] = [];
  const unimportantEls: FormElement[] = [];

  for (let i = 0; i < els.length; i++) {
    if (returnEls.length >= limit) {
      break;
    }

    const el = els[i];
    const type = (el as HTMLInputElement).type
      ? (el as HTMLInputElement).type.toLowerCase()
      : (el as HTMLInputElement).type;

    if (type === "checkbox" || type === "radio") {
      unimportantEls.push(el);
    } else {
      returnEls.push(el);
    }
  }

  const unimportantElsToAdd = limit - returnEls.length;

  if (unimportantElsToAdd > 0) {
    returnEls = returnEls.concat(unimportantEls.slice(0, unimportantElsToAdd));
  }

  return returnEls;
}

/**
 * Focus the element `el` and optionally restore its original value
 * @param {HTMLElement} el
 * @param {boolean} setVal Set the value of the element to its original value
 */
export function focusElement(el: FillableControl, setVal: boolean) {
  if (setVal) {
    const initialValue = el.value;

    el.focus();

    if (el.value !== initialValue) {
      el.value = initialValue;
    }
  } else {
    el.focus();
  }
}

/**
 * For a given element `el`, returns the value of the attribute `attrName`.
 * @param {HTMLElement} el
 * @param {string} attrName
 * @returns {string} The value of the attribute
 */
export function getElementAttrValue(el: any, attrName: string) {
  let attrVal = el[attrName];

  if ("string" == typeof attrVal) {
    return attrVal;
  }

  attrVal = el.getAttribute(attrName);

  return "string" == typeof attrVal ? attrVal : null;
}

/**
 * Returns the value of the given element.
 * @param {HTMLElement} el
 * @returns {any} Value of the element
 */
export function getElementValue(el: any) {
  switch (toLowerString(el.type)) {
    case "checkbox":
      return el.checked ? "✓" : "";
    case "hidden":
      el = el.value;

      if (!el || "number" != typeof el.length) {
        return "";
      }

      254 < el.length && (el = el.substr(0, 254) + "...SNIPPED");

      return el;
    default:
      if (!el.type && el.tagName.toLowerCase() === "span") {
        return el.innerText;
      }

      return el.value;
  }
}

/**
 * If `el` is a `<select>` element, return an array of all of the options' `text` properties.
 */
export function getSelectElementOptions(el: HTMLSelectElement): null | { options: string[] } {
  if (!el.options) {
    return null;
  }

  const options = Array.prototype.slice.call(el.options).map(function (option: HTMLOptionElement) {
    const optionText = option.text
      ? toLowerString(option.text)
          .replace(/\\s/gm, "")
          // eslint-disable-next-line no-useless-escape
          .replace(/[~`!@$%^&*()\\-_+=:;'\"\\[\\]|\\\\,<.>\\?]/gm, "")
      : null;

    return [optionText ? optionText : null, option.value];
  });

  return {
    options: options,
  };
}

/**
 * If `el` is in a data table, get the label in the row directly above it
 * @param {HTMLElement} el
 * @returns {string} A string containing the label, or null if not found
 */
export function getLabelTop(el: any) {
  let parent;

  // Traverse up the DOM until we reach either the top or the table data element containing our field
  for (el = el.parentElement || el.parentNode; el && "td" != toLowerString(el.tagName); ) {
    el = el.parentElement || el.parentNode;
  }

  // If we reached the top, return null
  if (!el || void 0 === el) {
    return null;
  }

  // Establish the parent of the table and make sure it's a table row
  parent = el.parentElement || el.parentNode;
  if ("tr" != parent.tagName.toLowerCase()) {
    return null;
  }

  // Get the previous sibling of the table row and make sure it's a table row
  parent = parent.previousElementSibling;

  if (
    !parent ||
    "tr" != (parent.tagName + "").toLowerCase() ||
    (parent.cells && el.cellIndex >= parent.cells.length)
  ) {
    return null;
  }

  // Parent is established as the row above the table data element containing our field
  // Now let's traverse over to the cell in the same column as our field
  el = parent.cells[el.cellIndex];

  // Get the contents of this label
  let elText = el.textContent || el.innerText;

  return (elText = cleanText(elText));
}

/**
 * Add property `prop` with value `val` to the object `obj`
 * @param {*} d unknown
 */
export function addProp(obj: Record<string, any>, prop: string, val: any, d?: unknown) {
  if ((0 !== d && d === val) || null === val || void 0 === val) {
    return;
  }

  obj[prop] = val;
}

/**
 * Converts the string `s` to lowercase
 * @param {string} s
 * @returns Lowercase string
 */
export function toLowerString(s: string | null) {
  return typeof s === "string" ? s.toLowerCase() : ("" + s).toLowerCase();
}

/**
 * Query the document `doc` for elements matching the selector `selector`
 */
export function queryDoc<T extends Element = Element>(doc: Document, query: string): Array<T> {
  let els: Array<T> = [];

  try {
    // Technically this returns a NodeListOf<Element> but it's ducktyped as an Array everywhere, so return it as an array here
    els = doc.querySelectorAll(query) as unknown as Array<T>;
  } catch (e) {
    /* no-op */
  }

  return els;
}

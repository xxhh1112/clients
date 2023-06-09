import { TYPE_CHECK } from "../constants";
import { FillableControl, ElementWithOpId, FormFieldElement } from "../types";

// CG - METHOD MIGRATED TO CollectAutofillContentService.trimAndRemoveNonPrintableText
/**
 * Clean up the string `unformattedString` to remove non-printable characters and whitespace.
 * @param {string} unformattedString
 * @returns {string} Clean text
 */
function cleanText(unformattedString: string | null): string | null {
  let newString = "";

  if (unformattedString) {
    newString = unformattedString.trim();
  }

  return newString.length ? newString : null;
}

// CG - METHOD MIGRATED TO CollectAutofillContentService.getTextContentFromElement
/**
 * If `element` is a text node, add the node's text to `siblingTexts`.
 * If `element` is an element node, add the element's `textContent or `innerText` to `siblingTexts`.
 * @param {string[]} siblingTexts An array of `textContent` or `innerText` values
 * @param {HTMLElement} element The element to push to the array
 */
export function getInnerText(siblingTexts: string[], element: Node) {
  let theText: string | Node["nodeValue"] = "";

  if (element.nodeType === Node.TEXT_NODE) {
    theText = element.nodeValue;
  } else if (element.nodeType === Node.ELEMENT_NODE) {
    theText = element.textContent || (element as HTMLElement).innerText;
  }

  theText = cleanText(theText);

  if (theText) {
    siblingTexts.push(theText);
  }
}

// CG - METHOD MIGRATED TO CollectAutofillContentService.isNewSectionElement
/**
 * Check if `element` is a type that indicates the transition to a new section of the page.
 * If so, this indicates that we should not use `element` or its children for getting autofill context for the previous element.
 * @param {HTMLElement} element The element to check
 * @returns {boolean} Returns `true` if `element` is an HTML element from a known set and `false` otherwise
 */
// @TODO fix `element` typing: "`tagName` doesn't exist on Node"
export function isNewSectionTag(element: any) {
  if (element) {
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

    const elementTag = (element.tagName || "").toLowerCase();

    return tags.includes(elementTag);
  } else {
    return true;
  }
}

// CG - METHOD MIGRATED TO CollectAutofillContentService.recursivelyGetTextFromPreviousSiblings
/**
 * Recursively gather all of the text values from the elements preceding `element` in the DOM
 * @param {HTMLElement} element
 * @param {string[]} siblingTexts An array of `textContent` or `innerText` values
 */
export function getAdjacentElementLabelValues(element: any, siblingTexts: string[]) {
  let sibling;

  // While the current element exists and has `previousSibling`
  while (element && element.previousSibling) {
    element = element.previousSibling;

    if (isNewSectionTag(element)) {
      return;
    }

    getInnerText(siblingTexts, element);
  }

  // If the current element exists and no valid sibling texts have been found
  if (element && !siblingTexts.length) {
    // Move up to parent element/node
    sibling = null;

    while (!sibling) {
      element = element.parentElement || element.parentNode;
      // If there is no parent element/node, exit loop
      if (!element) {
        return;
      }

      // Look at parent element/node siblings; if not a new section tag, and the sibling has `lastChild`, sibling becomes `lastChild`, loop ends
      sibling = element.previousSibling;

      while (sibling && !isNewSectionTag(sibling) && sibling.lastChild) {
        sibling = sibling.lastChild;
      }
    }

    // base case and recurse
    if (!isNewSectionTag(sibling)) {
      getInnerText(siblingTexts, sibling);

      if (!siblingTexts.length) {
        getAdjacentElementLabelValues(sibling, siblingTexts);
      }
    }
  }
}

// CG - METHOD MIGRATED TO CollectAutofillContentService.isElementHiddenByCss
/**
 * Determine if the element is visible.
 * Visible is defined as not having `display: none;` or `visibility: hidden;`.
 * @param {HTMLElement} element
 * @returns {boolean} Returns `true` if the element is visible and `false` otherwise
 */
export function isElementVisible(element: any) {
  let theEl = element;
  // Get the top level document
  // eslint-disable-next-line no-cond-assign
  element = (element = element.ownerDocument) ? element.defaultView : {};

  // walk the dom tree until we reach the top
  for (let elStyle; theEl && theEl !== document; ) {
    // Calculate the style of the element
    elStyle = element.getComputedStyle ? element.getComputedStyle(theEl, null) : theEl.style;

    // If there's no computed style at all, we're done, as we know that it's not hidden
    if (!elStyle) {
      // @TODO reachable?
      return true;
    }

    // If the element's computed style includes `display: none` or `visibility: hidden`, we know it's hidden
    if (elStyle.display === "none" || elStyle.visibility === "hidden") {
      return false;
    }

    // At this point, we aren't sure if the element is hidden or not, so we need to keep walking up the tree
    theEl = theEl.parentNode;
  }

  return theEl === document;
}

// CG - METHOD MIGRATED TO CollectAutofillContentService.isElementCurrentlyViewable
/**
 * Determine if the element is "viewable" on the screen.
 * "Viewable" is defined as being visible in the DOM and being within the confines of the viewport.
 * @param {HTMLElement} element
 * @returns {boolean} Returns `true` if the element is viewable and `false` otherwise
 */
export function isElementViewable(element: FormFieldElement) {
  const theDoc = element.ownerDocument.documentElement;
  const rect = element.getBoundingClientRect(); // getBoundingClientRect is relative to the viewport
  const docScrollWidth = theDoc.scrollWidth; // scrollWidth is the width of the document including any overflow
  const docScrollHeight = theDoc.scrollHeight; // scrollHeight is the height of the document including any overflow
  const leftOffset = rect.left - theDoc.clientLeft; // How far from the left of the viewport is the element, minus the left border width?
  const topOffset = rect.top - theDoc.clientTop; // How far from the top of the viewport is the element, minus the top border width?
  let theRect;

  if (
    !isElementVisible(element) ||
    !element.offsetParent ||
    element.clientWidth < 10 ||
    element.clientHeight < 10
  ) {
    return false;
  }

  const rects = element.getClientRects();

  if (!rects.length) {
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
  let pointEl = element.ownerDocument.elementFromPoint(
    leftOffset +
      (rect.right > window.innerWidth ? (window.innerWidth - leftOffset) / 2 : rect.width / 2),
    topOffset +
      (rect.bottom > window.innerHeight ? (window.innerHeight - topOffset) / 2 : rect.height / 2)
  );

  for (; pointEl && pointEl !== element && pointEl !== (document as unknown as Element); ) {
    // If the element we found is a label, and the element we're checking has labels
    if (
      pointEl.tagName &&
      typeof pointEl.tagName === TYPE_CHECK.STRING &&
      pointEl.tagName.toLowerCase() === "label" &&
      (element as FillableControl).labels &&
      0 < ((element as FillableControl).labels?.length || 0)
    ) {
      // Return true if the element we found is one of the labels for the element we're checking.
      // This means that the element we're looking for is considered viewable
      return 0 <= Array.prototype.slice.call((element as FillableControl).labels).indexOf(pointEl);
    }

    // Walk up the DOM tree to check the parent element
    pointEl = pointEl.parentNode as Element;
  }

  // If the for loop exited because we found the element we're looking for, return true, as it's viewable
  // If the element that we found isn't the element we're looking for, it means the element we're looking for is not viewable
  return pointEl === element;
}

// CG - CONSIDERING MOVING THIS METHOD TO SHARED SCOPE OF AutofillInit CLASS
/**
 * Determine if we can apply styling to `element` to indicate that it was filled.
 * @param {HTMLElement} element
 * @param {HTMLElement} animateTheFilling
 * @returns {boolean} Returns true if we can see the element to apply styling.
 */
export function canSeeElementToStyle(element: HTMLElement, animateTheFilling: boolean) {
  let currentElement: any = animateTheFilling;

  if (currentElement) {
    a: {
      currentElement = element;

      // Check the parent tree of `element` for display/visibility
      for (
        let owner: any = element.ownerDocument.defaultView, theStyle;
        currentElement && currentElement !== document;

      ) {
        theStyle = owner.getComputedStyle
          ? owner.getComputedStyle(currentElement, null)
          : currentElement.style;

        if (!theStyle) {
          currentElement = true;

          break a;
        }

        if (theStyle.display === "none" || theStyle.visibility === "hidden") {
          currentElement = false;

          break a;
        }

        currentElement = currentElement.parentNode;
      }

      currentElement = currentElement === document;
    }
  }

  if (
    animateTheFilling &&
    currentElement &&
    !(element as FillableControl)?.type &&
    element.tagName.toLowerCase() === "span"
  ) {
    return true;
  }

  return currentElement
    ? ["email", "text", "password", "number", "tel", "url"].includes(
        (element as FillableControl).type || ""
      )
    : false;
}

// CG - CONSIDERING DEPRECATING THIS METHOD
/**
 * Helper for `document.querySelectorAll`
 * @param {string} selector
 * @return {NodeListOf<Element>}
 */
export function selectAllFromDoc(selector: string): NodeListOf<Element> {
  try {
    return document.querySelectorAll(selector);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("An unexpected error occurred: " + error);

    return [] as unknown as NodeListOf<Element>;
  }
}

// CG - CONSIDERING MOVING THIS METHOD TO SHARED SCOPE OF AutofillInit CLASS
/**
 * Find the first element for the given `opid`, falling back to the first relevant unmatched
 * element if non is found.
 * @param {number} targetOpId
 * @returns {HTMLElement} The element for the given `opid`, or `null` if not found.
 */
export function getElementByOpId(
  targetOpId?: string | null
): HTMLButtonElement | FillableControl | null | undefined {
  let currentElement;

  // @TODO do this check at the callsite(s)
  if (!targetOpId) {
    return null;
  }

  try {
    const elements = Array.from(
      selectAllFromDoc("input, select, button, textarea, span[data-bwautofill]")
    ) as Array<FillableControl | HTMLButtonElement>;

    const filteredElements = elements.filter(
      (element) =>
        (element as ElementWithOpId<FillableControl | HTMLButtonElement>).opid === targetOpId
    );

    if (filteredElements.length) {
      currentElement = filteredElements[0];

      if (filteredElements.length > 1) {
        // eslint-disable-next-line no-console
        console.warn("More than one element found with opid " + targetOpId);
      }
    } else {
      const elementIndex = parseInt(targetOpId.split("__")[1], 10);

      if (isNaN(elementIndex) || !elements[elementIndex]) {
        currentElement = null;
      } else {
        currentElement = elements[elementIndex];
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("An unexpected error occurred: " + error);
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    return currentElement;
  }
}

// CG - METHOD MIGRATED TO CollectAutofillContentService.getAutofillFieldElements
/**
 * Query `targetDocument` for form elements that we can use for autofill, limited and
 * ranked for importance by `limit`.
 * @param {Document} targetDocument The Document to query
 * @param {number} limit The maximum number of elements to return
 * @returns {FormFieldElement[]}
 */
export function getFormElements(targetDocument: Document, limit?: number): FormFieldElement[] {
  let elementList: HTMLInputElement[] = [];

  try {
    // @TODO `select` and `textarea` should also have `data-bwignore` qualifier
    elementList = Array.from(
      targetDocument.querySelectorAll(
        'input:not([type="hidden"]):not([type="submit"]):not([type="reset"])' +
          ':not([type="button"]):not([type="image"]):not([type="file"]):not([data-bwignore]), ' +
          "select:not([data-bwignore]), textarea:not([data-bwignore]), " +
          "span[data-bwautofill]"
      )
    );
  } catch (e) {
    /* no-op */
  }

  if (!limit || elementList.length <= limit) {
    return elementList;
  }

  const returnElements: FormFieldElement[] = [];
  const unimportantElements: FormFieldElement[] = [];

  elementList.every((element: HTMLInputElement) => {
    if (returnElements.length >= limit) {
      return false; // stop iterating
    }

    const elementType = element.type?.toLowerCase();

    if (["checkbox", "radio"].includes(elementType)) {
      unimportantElements.push(element);
    } else {
      returnElements.push(element);
    }

    return true;
  });

  return [...returnElements, ...unimportantElements].slice(0, limit);
}

// CG - METHOD MIGRATED TO CollectAutofillContentService.getPropertyOrAttribute
/**
 * For a given element `element`, returns the value of the attribute `attributeName`.
 * @param {HTMLElement} element
 * @param {string} attributeName
 * @returns {string} The value of the attribute
 */
export function getPropertyOrAttribute(element: any, attributeName: string) {
  let targetValue = element[attributeName];

  if (typeof targetValue === TYPE_CHECK.STRING) {
    return targetValue;
  }

  targetValue = element.getAttribute(attributeName);

  return typeof targetValue == TYPE_CHECK.STRING ? targetValue : null;
}

// CG - METHOD MIGRATED TO CollectAutofillContentService.getElementValue
/**
 * Returns the value of the given element.
 * @param {HTMLElement} element
 * @returns {any} Value of the element
 */
export function getElementValue(element: any) {
  switch (toLowerString(element.type)) {
    case "checkbox": {
      return element.checked ? "✓" : "";
    }
    case "hidden": {
      let elementValue = element.value;

      if (!elementValue || typeof elementValue.length !== TYPE_CHECK.NUMBER) {
        return "";
      }

      const inputValueMaxLength = 254;

      if (elementValue.length > inputValueMaxLength) {
        elementValue = elementValue.substr(0, inputValueMaxLength) + "...SNIPPED";
      }

      return elementValue;
    }
    default: {
      if (!element.type && element.tagName.toLowerCase() === "span") {
        return element.innerText;
      }

      return element.value;
    }
  }
}

// CG - METHOD MIGRATED TO CollectAutofillContentService.getSelectElementOptions
/**
 * If `element` is a `<select>` element, return an array of all of the options' `text` properties.
 * @param {HTMLSelectElement} element
 * @return {{ options: string[][] }} array of text values from all the passed `select` options
 */
export function getSelectElementOptions(element: HTMLSelectElement): {
  options: (string | null)[][];
} {
  const options = Array.from(element.options).map(function (option: HTMLOptionElement) {
    const optionText = option.text
      ? toLowerString(option.text)
          // remove whitespace and punctuation
          .replace(/[\s~`!@$%^&*()\-_+=:;'"[\]|\\,<.>?]/gm, "")
      : null;

    return [optionText, option.value];
  });

  return { options };
}

// CG - METHOD MIGRATED TO CollectAutofillContentService.createAutofillFieldTopLabel
/**
 * If `element` is in a data table, get the label in the row directly above it
 * @param {HTMLElement} element
 * @returns {string} A string containing the label, or null if not found
 */
// @TODO handle cases where the table layout utilizes `thead` and `tbody`?
export function getLabelTop(element: any) {
  let parent;

  // Traverse up the DOM until we reach either the top or the table data element containing our field
  for (
    element = element.parentElement || element.parentNode;
    element && "td" != toLowerString(element.tagName);

  ) {
    element = element.parentElement || element.parentNode;
  }

  // If we reached the top, return null
  if (!element || void 0 === element) {
    return null;
  }

  // Establish the parent of the table and make sure it's a table row
  parent = element.parentElement || element.parentNode;
  if ("tr" != parent.tagName.toLowerCase()) {
    return null;
  }

  // Get the previous sibling of the table row and make sure it's a table row
  parent = parent.previousElementSibling;

  if (
    !parent ||
    "tr" != (parent.tagName + "").toLowerCase() ||
    (parent.cells && element.cellIndex >= parent.cells.length)
  ) {
    return null;
  }

  // Parent is established as the row above the table data element containing our field
  // Now let's traverse over to the cell in the same column as our field
  element = parent.cells[element.cellIndex];

  // Get the contents of this label
  let elText = element.textContent || element.innerText;

  return (elText = cleanText(elText));
}

// CG - CONSIDERING DEPRECATING THIS METHOD
/**
 * Converts the string `s` to lowercase
 * @param {string} s
 * @returns Lowercase string
 */
export function toLowerString(s: string | null) {
  return s && typeof s === TYPE_CHECK.STRING ? s.toLowerCase() : ("" + s).toLowerCase();
}

// CG - CONSIDERING DEPRECATING THIS METHOD
/**
 * Query the document `targetDocument` for elements matching the selector `selector`
 * @param {Document} targetDocument
 * @param {string} selector
 * @return {*}  {HTMLElement[]}
 */
export function queryDocument(targetDocument: Document, selector: string): HTMLElement[] {
  let elements: HTMLElement[] = [];

  try {
    elements = Array.from(targetDocument.querySelectorAll(selector)) as HTMLElement[];
  } catch (error) {
    /* no-op */
  }

  return elements;
}

import AutofillField from "../models/autofill-field";
import AutofillForm from "../models/autofill-form";
import AutofillPageDetails from "../models/autofill-page-details";
import { ElementWithOpId, FillableControl, FormElement, FormElementWithAttribute } from "../types";

class AutofillCollect {
  private autofillFormsData: Record<string, AutofillForm> = {};
  private autofillFieldsData: AutofillField[] = [];
  private readonly queriedFieldsLimit = 50;

  /**
   * Builds the data for all the forms and fields
   * that are found within the page DOM.
   * @returns {Promise<AutofillPageDetails>}
   * @public
   */
  async getPageDetails(): Promise<AutofillPageDetails> {
    this.autofillFormsData = this.buildAutofillFormsData();
    this.autofillFieldsData = await this.buildAutofillFieldsData();

    return {
      title: document.title,
      url: (document.defaultView || window).location.href,
      documentUrl: document.location.href,
      forms: this.autofillFormsData,
      fields: this.autofillFieldsData,
      collectedTimestamp: Date.now(),
    };
  }

  /**
   * Queries the DOM for all the forms elements and
   * returns a collection of AutofillForm objects.
   * @returns {Record<string, AutofillForm>}
   * @private
   */
  private buildAutofillFormsData(): Record<string, AutofillForm> {
    const autofillForms: Record<string, AutofillForm> = {};
    const documentFormElements = document.querySelectorAll("form");

    documentFormElements.forEach((formElement: HTMLFormElement, index: number) => {
      const formOpid = `__form__${index}`;
      formElement.opid = formOpid;

      autofillForms[formOpid] = {
        opid: formOpid,
        htmlAction: new URL(
          this.getPropertyOrAttribute(formElement, "action"),
          window.location.href
        ).href,
        htmlName: this.getPropertyOrAttribute(formElement, "name"),
        htmlID: this.getPropertyOrAttribute(formElement, "id"),
        htmlMethod: this.getPropertyOrAttribute(formElement, "method"),
      };
    });

    return autofillForms;
  }

  /**
   * Queries the DOM for all the field elements and
   * returns a list of AutofillField objects.
   * @returns {Promise<AutofillField[]>}
   * @private
   */
  private async buildAutofillFieldsData(): Promise<AutofillField[]> {
    const autofillFieldElements = this.getAutofillFieldElements(this.queriedFieldsLimit);
    const autofillFieldDataPromises = autofillFieldElements.map(this.buildAutofillFieldDataItem);

    return Promise.all(autofillFieldDataPromises);
  }

  /**
   * Queries the DOM for all the field elements that can be autofilled,
   * and returns a list limited to the given `fieldsLimit` number that
   * is ordered by priority.
   * @param {number} fieldsLimit - The maximum number of fields to return
   * @returns {FormElement[]}
   * @private
   */
  private getAutofillFieldElements(fieldsLimit?: number): FormElement[] {
    const formFieldElements: FormElement[] = [
      ...(document.querySelectorAll(
        'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]):not([type="file"]):not([data-bwignore]), ' +
          "textarea:not([data-bwignore]), " +
          "select:not([data-bwignore]), " +
          "span[data-bwautofill]"
      ) as NodeListOf<FormElement>),
    ];

    if (!fieldsLimit || formFieldElements.length <= fieldsLimit) {
      return formFieldElements;
    }

    const priorityFormFields: FormElement[] = [];
    const unimportantFormFields: FormElement[] = [];
    const unimportantFieldTypesSet = new Set(["checkbox", "radio"]);
    for (const element of formFieldElements) {
      if (priorityFormFields.length >= fieldsLimit) {
        break;
      }

      const fieldType = this.getPropertyOrAttribute(element, "type")?.toLowerCase();
      if (unimportantFieldTypesSet.has(fieldType)) {
        unimportantFormFields.push(element);
        continue;
      }

      priorityFormFields.push(element);
    }

    return [...priorityFormFields, ...unimportantFormFields].slice(0, fieldsLimit);
  }

  private buildAutofillFieldDataItem = async (
    element: ElementWithOpId<FormElement>,
    index: number
  ): Promise<AutofillField> => {
    const fieldOpid = `__${index}`;
    element.opid = fieldOpid;

    const autofillFieldBase = {
      opid: fieldOpid,
      elementNumber: index,
      maxLength: this.getAutofillFieldMaxLength(element),
      viewable: await this.isElementCurrentlyViewable(element),
      htmlID: this.getPropertyOrAttribute(element, "id"),
      htmlName: this.getPropertyOrAttribute(element, "name"),
      htmlClass: this.getPropertyOrAttribute(element, "class"),
      tabindex: this.getPropertyOrAttribute(element, "tabindex"),
      title: this.getPropertyOrAttribute(element, "title"),
      tagName: this.getPropertyOrAttribute(element, "tagName")?.toLowerCase(),
    };

    if (element instanceof HTMLSpanElement) {
      return autofillFieldBase;
    }

    const autoCompleteType =
      this.getPropertyOrAttribute(element, "x-autocompletetype") ||
      this.getPropertyOrAttribute(element, "autocompletetype") ||
      this.getPropertyOrAttribute(element, "autocomplete");
    let autofillFieldLabels = {};
    const elementType = this.getPropertyOrAttribute(element, "type")?.toLowerCase();
    if (elementType !== "hidden") {
      autofillFieldLabels = {
        "label-tag": this.getAutofillFieldLabelTag(element),
        "label-data": this.getPropertyOrAttribute(element, "data-label"),
        "label-aria": this.getPropertyOrAttribute(element, "aria-label"),
        "label-top": this.createAutofillFieldTopLabel(element),
        "label-right": this.createAutofillFieldRightLabel(element),
        "label-left": this.createAutofillFieldLeftLabel(element),
        placeholder: this.getPropertyOrAttribute(element, "placeholder"),
      };
    }

    return {
      ...autofillFieldBase,
      ...autofillFieldLabels,
      rel: this.getPropertyOrAttribute(element, "rel"),
      type: elementType,
      value: this.getElementValue(element),
      checked: Boolean(this.getPropertyOrAttribute(element, "checked")),
      autoCompleteType: autoCompleteType !== "off" ? autoCompleteType : null,
      disabled: Boolean(this.getPropertyOrAttribute(element, "disabled")),
      readonly: Boolean(this.getPropertyOrAttribute(element, "readOnly")),
      selectInfo:
        element instanceof HTMLSelectElement ? this.getSelectElementOptions(element) : null,
      form: element.form ? this.getPropertyOrAttribute(element.form, "opid") : null,
      "aria-hidden": this.getPropertyOrAttribute(element, "aria-hidden") === "true",
      "aria-disabled": this.getPropertyOrAttribute(element, "aria-disabled") === "true",
      "aria-haspopup": this.getPropertyOrAttribute(element, "aria-haspopup") === "true",
      "data-stripe": this.getPropertyOrAttribute(element, "data-stripe"),
    };
  };

  /**
   * Creates a label tag used to autofill the element pulled from a label
   * associated with the element's id, name, parent element or from an
   * associated description term element if no other labels can be found.
   * Returns a string containing all the `textContent` or `innerText`
   * values of the label elements.
   * @param {FillableControl} element
   * @returns {string}
   * @private
   */
  private getAutofillFieldLabelTag(element: ElementWithOpId<FillableControl>): string {
    const labelElementsSet: Set<HTMLElement> = new Set(element.labels);

    if (labelElementsSet.size) {
      return this.createLabelElementsTag(labelElementsSet);
    }

    const labelElements: NodeListOf<HTMLLabelElement> | null = this.queryElementLabels(element);
    labelElements?.forEach((labelElement) => labelElementsSet.add(labelElement));

    let currentElement: HTMLElement | null = element;
    while (currentElement && currentElement !== document.documentElement) {
      if (currentElement instanceof HTMLLabelElement) {
        labelElementsSet.add(currentElement);
      }

      currentElement = currentElement.closest("label");
    }

    if (
      !labelElementsSet.size &&
      element.parentElement?.tagName.toLowerCase() === "dd" &&
      element.parentElement.previousElementSibling?.tagName.toLowerCase() === "dt"
    ) {
      labelElementsSet.add(element.parentElement.previousElementSibling as HTMLElement);
    }

    return this.createLabelElementsTag(labelElementsSet);
  }

  private queryElementLabels(element: FillableControl): NodeListOf<HTMLLabelElement> | null {
    let labelQuerySelectors = element.id ? `label[for="${element.id}"]` : "";
    if (element.name) {
      const forElementNameSelector = `label[for="${element.name}"]`;
      labelQuerySelectors = labelQuerySelectors
        ? `${labelQuerySelectors}, ${forElementNameSelector}`
        : forElementNameSelector;
    }

    if (!labelQuerySelectors) {
      return null;
    }

    return document.querySelectorAll(labelQuerySelectors);
  }

  /**
   * Map over all the label elements and creates a
   * string of the text content of each label element.
   * @param {Set<HTMLElement>} labelElementsSet
   * @returns {string}
   * @private
   */
  private createLabelElementsTag = (labelElementsSet: Set<HTMLElement>): string => {
    return [...labelElementsSet]
      .map((labelElement) => {
        const textContent: string | null = labelElement
          ? labelElement.textContent || labelElement.innerText
          : null;

        return this.trimAndRemoveNonPrintableText(textContent || "");
      })
      .join("");
  };

  private getAutofillFieldMaxLength(element: ElementWithOpId<FormElement>): number | null {
    const elementHasMaxLengthProperty =
      element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
    let elementMaxLength =
      elementHasMaxLengthProperty && Number(element.maxLength) > -1
        ? Number(element.maxLength)
        : 999;
    elementMaxLength = Math.min(elementMaxLength, 999);

    return elementMaxLength !== 999 ? elementMaxLength : null;
  }

  private createAutofillFieldRightLabel(element: ElementWithOpId<FormElement>): string {
    const labelTextContent: string[] = [];
    let currentElement = element;

    while (currentElement && currentElement.nextElementSibling) {
      currentElement = currentElement.nextElementSibling as ElementWithOpId<HTMLElement>;
      if (this.isNewSectionElement(currentElement)) {
        break;
      }

      const textContent = this.getTextContentFromElement(currentElement);
      if (textContent) {
        labelTextContent.push(textContent);
      }
    }

    return labelTextContent.join("");
  }

  private createAutofillFieldLeftLabel(element: ElementWithOpId<FormElement>): string {
    const labelTextContent: string[] = this.recursivelyGetTextFromPreviousSiblings(element);

    return labelTextContent.reverse().join("");
  }

  /**
   * Assumes that the input elements that are to be autofilled are within a
   * table structure. Queries the previous sibling of the parent row that
   * the input element is in and returns the text content of the cell that
   * is in the same column as the input element.
   * @param {ElementWithOpId<FormElement>} element
   * @returns {string | null}
   * @private
   */
  private createAutofillFieldTopLabel(element: ElementWithOpId<FormElement>): string | null {
    const tableDataElement = element.closest("td");
    if (!tableDataElement) {
      return null;
    }

    const tableDataElementIndex = tableDataElement.cellIndex;
    const parentSiblingTableRowElement = tableDataElement.closest("tr")
      ?.previousElementSibling as HTMLTableRowElement;

    return parentSiblingTableRowElement?.cells?.length > tableDataElementIndex
      ? this.getTextContentFromElement(parentSiblingTableRowElement.cells[tableDataElementIndex])
      : null;
  }

  /**
   * Check if the element's tag indicates that a transition to a new section of the
   * page is occurring. If so, we should not use the element or its children in order
   * to get autofill context for the previous element.
   * @param {HTMLElement} currentElement
   * @returns {boolean}
   * @private
   */
  private isNewSectionElement(currentElement: HTMLElement | Node): boolean {
    if (!currentElement) {
      return true;
    }

    const transitionalElementTagsSet = new Set([
      "html",
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
    ]);
    return (
      "tagName" in currentElement &&
      transitionalElementTagsSet.has(currentElement.tagName.toLowerCase())
    );
  }

  /**
   * Gets the text content from a passed element, regardless of whether it is a
   * text node, an element node or an HTMLElement.
   * @param {Node | HTMLElement} element
   * @returns {string}
   * @private
   */
  private getTextContentFromElement(element: Node | HTMLElement): string {
    if (element.nodeType === Node.TEXT_NODE) {
      return this.trimAndRemoveNonPrintableText(element.nodeValue);
    }

    return this.trimAndRemoveNonPrintableText(
      element.textContent || (element as HTMLElement).innerText
    );
  }

  /**
   * Removes non-printable characters from the passed text
   * content and trims leading and trailing whitespace.
   * @param {string} textContent
   * @returns {string}
   * @private
   */
  private trimAndRemoveNonPrintableText(textContent: string): string {
    return (textContent || "")
      .replace(/[^\x20-\x7E]+|\s+/g, " ") // Strip out non-primitive characters and replace multiple spaces with a single space
      .trim(); // Trim leading and trailing whitespace
  }

  /**
   * Get the text content from the previous siblings of the element. If
   * no text content is found, recursively get the text content from the
   * previous siblings of the parent element.
   * @param {FormElement} element
   * @returns {string[]}
   * @private
   */
  private recursivelyGetTextFromPreviousSiblings(element: Node | HTMLElement): string[] {
    const textContentItems: string[] = [];
    let currentElement = element;
    while (currentElement && currentElement.previousSibling) {
      // Ensure we are capturing text content from nodes and elements.
      currentElement = currentElement.previousSibling;

      if (this.isNewSectionElement(currentElement)) {
        return textContentItems;
      }

      const textContent = this.getTextContentFromElement(currentElement);
      if (textContent) {
        textContentItems.push(textContent);
      }
    }

    if (!currentElement || textContentItems.length) {
      return textContentItems;
    }

    // Prioritize capturing text content from elements rather than nodes.
    currentElement = currentElement.parentElement || currentElement.parentNode;

    let siblingElement =
      currentElement instanceof HTMLElement
        ? currentElement.previousElementSibling
        : currentElement.previousSibling;
    while (siblingElement?.lastChild && !this.isNewSectionElement(siblingElement)) {
      siblingElement = siblingElement.lastChild;
    }

    if (this.isNewSectionElement(siblingElement)) {
      return textContentItems;
    }

    const textContent = this.getTextContentFromElement(siblingElement);
    if (textContent) {
      textContentItems.push(textContent);
      return textContentItems;
    }

    return this.recursivelyGetTextFromPreviousSiblings(siblingElement);
  }

  /**
   * Get the value of a property or attribute from a FormElement.
   * @param {HTMLElement} element
   * @param {string} attributeName
   * @returns {string | null}
   * @private
   */
  private getPropertyOrAttribute(element: HTMLElement, attributeName: string): string | null {
    if (attributeName in element) {
      return (element as FormElementWithAttribute)[attributeName];
    }

    return element.getAttribute(attributeName);
  }

  /**
   * Gets the value of the element. If the element is a checkbox, returns a checkmark if the
   * checkbox is checked, or an empty string if it is not checked. If the element is a hidden
   * input, returns the value of the input if it is less than 254 characters, or a truncated
   * value if it is longer than 254 characters.
   * @param {FormElement} element
   * @returns {string}
   * @private
   */
  private getElementValue(element: FormElement): string {
    if (element instanceof HTMLSpanElement) {
      const spanTextContent = element.textContent || element.innerText;
      return spanTextContent || "";
    }

    const elementValue = element.value || "";
    const elementType = String(element.type).toLowerCase();
    if ("checked" in element && elementType === "checkbox") {
      return element.checked ? "✓" : "";
    }

    if (elementType === "hidden") {
      return elementValue.length > 254
        ? `${elementValue.substring(0, 254)}...SNIPPED`
        : elementValue;
    }

    return elementValue;
  }

  /**
   * Get the options from a select element and return them as an array
   * of arrays indicating the select element option text and value.
   * @param {HTMLSelectElement} element
   * @returns {{options: (string | null)[][]}}
   * @private
   */
  private getSelectElementOptions(element: HTMLSelectElement): { options: (string | null)[][] } {
    const options = [...element.options].map((option) => {
      const optionText = option.text
        ? String(option.text)
            .toLowerCase()
            .replace(/[\s~`!@$%^&#*()\-_+=:;'"[\]|\\,<.>?]/gm, "") // Remove whitespace and punctuation
        : null;

      return [optionText, option.value];
    });

    return { options };
  }

  private async isElementCurrentlyViewable(element: FormElement): Promise<boolean> {
    // If the element is not intersecting, it is not viewable.
    const elementObserverEntry = await this.getElementIntersectionObserverEntry(element);
    if (!elementObserverEntry.isIntersecting) {
      return false;
    }

    const targetElement = elementObserverEntry.target as FormElement;
    const targetElementDocument = targetElement.ownerDocument;
    const elementBoundingClientRect = elementObserverEntry.boundingClientRect;
    if (this.isElementAbsentFromViewport(targetElementDocument, elementBoundingClientRect)) {
      return false;
    }

    if (this.isElementHiddenByCss(targetElement)) {
      return false;
    }

    return this.targetElementIsNotHiddenBehindAnotherElement(
      targetElement,
      targetElementDocument,
      elementBoundingClientRect
    );
  }

  // Check the bounds of the element against the element's owner document's viewport. If the
  // element size is too small or the element is overflowing the viewport, it is not viewable.
  private isElementAbsentFromViewport(
    targetElementDocument: Document,
    elementBoundingClientRect: DOMRectReadOnly
  ): boolean {
    const documentElement = targetElementDocument.documentElement;
    const documentElementHeight = documentElement.scrollHeight;
    const documentElementWidth = documentElement.scrollWidth;
    const elementTopOffset = elementBoundingClientRect.top - documentElement.clientTop;
    const elementLeftOffset = elementBoundingClientRect.left - documentElement.clientLeft;
    const isElementSizeInsufficient =
      elementBoundingClientRect.width < 10 || elementBoundingClientRect.height < 10;
    const isElementOverflowingLeftViewport = elementLeftOffset < 0;
    const isElementOverflowingRightViewport =
      elementLeftOffset + elementBoundingClientRect.width > documentElementWidth;
    const isElementOverflowingTopViewport = elementTopOffset < 0;
    const isElementOverflowingBottomViewport =
      elementTopOffset + elementBoundingClientRect.height > documentElementHeight;

    return (
      isElementSizeInsufficient ||
      isElementOverflowingLeftViewport ||
      isElementOverflowingRightViewport ||
      isElementOverflowingTopViewport ||
      isElementOverflowingBottomViewport
    );
  }

  /**
   * Check if the target element is hidden using CSS. This is done by checking the opacity, display,
   * visibility, and clip-path CSS properties of the element. We also check the opacity of all
   * parent elements to ensure that the target element is not hidden by a parent element.
   * @param {FormElement} targetElement
   * @returns {boolean}
   * @private
   */
  private isElementHiddenByCss(targetElement: FormElement): boolean {
    const targetElementDocument = targetElement.ownerDocument;
    const targetElementWindow = targetElementDocument.defaultView || window;
    const documentElement = targetElementDocument.documentElement;
    let cachedComputedStyle: CSSStyleDeclaration | null = null;
    const getElementStyle = (element: FormElement, styleProperty: string): string =>
      element.style.getPropertyValue(styleProperty) ||
      getCachedComputedStyle(element).getPropertyValue(styleProperty);
    const getCachedComputedStyle = (element: FormElement): CSSStyleDeclaration => {
      if (!cachedComputedStyle) {
        cachedComputedStyle = targetElementWindow.getComputedStyle(element);
      }

      return cachedComputedStyle;
    };
    const isElementInvisible = () => getElementStyle(targetElement, "opacity") === "0";
    const isElementNotDisplayed = () => getElementStyle(targetElement, "display") === "none";
    const isElementNotVisible = () =>
      new Set(["hidden", "collapse"]).has(getElementStyle(targetElement, "visibility"));
    const isElementClippedByPath = () =>
      new Set([
        "circle(0)",
        "circle(0px)",
        "circle(0px at 50% 50%)",
        "polygon(0 0, 0 0, 0 0, 0 0)",
        "polygon(0px 0px, 0px 0px, 0px 0px, 0px 0px)",
      ]).has(getElementStyle(targetElement, "clipPath"));
    if (
      isElementInvisible() ||
      isElementNotDisplayed() ||
      isElementNotVisible() ||
      isElementClippedByPath()
    ) {
      return true;
    }

    // Check parent elements to identify if the element is invisible through a zero opacity.
    let parentElement = targetElement.parentElement;
    while (parentElement && parentElement !== documentElement) {
      cachedComputedStyle = null;
      const isParentElementInvisible = getElementStyle(targetElement, "opacity") === "0";
      if (isParentElementInvisible) {
        return true;
      }

      parentElement = parentElement.parentElement;
    }

    return false;
  }

  private targetElementIsNotHiddenBehindAnotherElement(
    targetElement: FormElement,
    targetElementDocument: Document,
    elementBoundingClientRect: DOMRectReadOnly
  ): boolean {
    // If the element is intersecting, we need to check if it is actually visible on the page. Check the center
    // point of the element and use elementFromPoint to see if the element is actually returned as the
    // element at that point. If it is not, the element is not viewable.
    let elementAtCenterPoint = targetElementDocument.elementFromPoint(
      elementBoundingClientRect.left + elementBoundingClientRect.width / 2,
      elementBoundingClientRect.top + elementBoundingClientRect.height / 2
    );

    //  If the element at the center point is a label, check if the label is for the element.
    //  If it is, the element is viewable. If it is not, the element is not viewable.
    while (
      elementAtCenterPoint &&
      elementAtCenterPoint !== targetElement &&
      elementAtCenterPoint instanceof HTMLLabelElement
    ) {
      const labelForAttribute = elementAtCenterPoint.getAttribute("for");
      const elementAssignedToLabel = targetElementDocument.getElementById(labelForAttribute);

      // TODO - Think through cases where a label is a parent of an element and it is implicitly assigned to the label.
      if (elementAssignedToLabel === targetElement) {
        return true;
      }

      elementAtCenterPoint = elementAtCenterPoint.closest("label");
    }

    return elementAtCenterPoint === targetElement;
  }

  private async getElementIntersectionObserverEntry(
    element: FormElement
  ): Promise<IntersectionObserverEntry> {
    return new Promise((resolve) => {
      const observer = new IntersectionObserver(
        (entries) => {
          resolve(entries[0]);
          observer.disconnect();
        },
        { root: element.ownerDocument }
      );
      observer.observe(element);
    });
  }
}

export default AutofillCollect;

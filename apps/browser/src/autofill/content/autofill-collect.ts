import AutofillField from "../models/autofill-field";
import AutofillForm from "../models/autofill-form";
import AutofillPageDetails from "../models/autofill-page-details";
import { ElementWithOpId, FillableControl, FormElement, FormElementWithAttribute } from "../types";
import {
  getLabelTop,
  getSelectElementOptions,
  isElementViewable,
  isElementVisible,
} from "../utils";

class AutofillCollect {
  private autofillFormsData: Record<string, AutofillForm> = {};
  private autofillFieldsData: AutofillField[] = [];
  private readonly queriedFieldsLimit = 50;

  /**
   * Builds the data for all the forms and fields
   * that are found within the page DOM.
   * @returns {AutofillPageDetails}
   * @public
   */
  getPageDetails(): AutofillPageDetails {
    this.autofillFormsData = this.buildAutofillFormsData();
    this.autofillFieldsData = this.buildAutofillFieldsData();

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
   * @returns {AutofillField[]}
   * @private
   */
  private buildAutofillFieldsData(): AutofillField[] {
    const autofillFieldElements = this.getAutofillFieldElements(this.queriedFieldsLimit);

    return autofillFieldElements.map(this.buildAutofillFieldDataItem);
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

  private buildAutofillFieldDataItem = (
    element: ElementWithOpId<FormElement>,
    index: number
  ): AutofillField => {
    const fieldOpid = `__${index}`;
    element.opid = fieldOpid;

    const autofillFieldBase = {
      opid: fieldOpid,
      elementNumber: index,
      maxLength: this.getAutofillFieldMaxLength(element),
      visible: isElementVisible(element),
      viewable: isElementViewable(element),
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
        "label-top": getLabelTop(element),
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
      selectInfo: element instanceof HTMLSelectElement ? getSelectElementOptions(element) : null,
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

      currentElement = currentElement.parentElement;
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
      if (this.isTransitionalElement(currentElement)) {
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

  // CG - METHOD MIGRATED FROM utils/collect.ts - isNewSectionTag
  /**
   * Check if the element's tag indicates that a transition to a new section of the
   * page is occurring. If so, we should not use the element or its children in order
   * to get autofill context for the previous element.
   * @param {HTMLElement} currentElement
   * @returns {boolean}
   * @private
   */
  private isTransitionalElement(currentElement: HTMLElement | Node): boolean {
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

  private getTextContentFromElement(element: Node | HTMLElement): string {
    if (element.nodeType === Node.TEXT_NODE) {
      return this.trimAndRemoveNonPrintableText(element.nodeValue);
    }

    if (element.nodeType === Node.ELEMENT_NODE) {
      return this.trimAndRemoveNonPrintableText(element.textContent);
    }

    return element instanceof HTMLElement
      ? this.trimAndRemoveNonPrintableText(element.innerText)
      : "";
  }

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
      currentElement = currentElement.previousSibling;

      if (this.isTransitionalElement(currentElement)) {
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

    // Prioritize capturing content from elements rather than text nodes.
    currentElement = currentElement.parentElement || currentElement.parentNode;

    let siblingElement =
      currentElement instanceof HTMLElement
        ? currentElement.previousElementSibling
        : currentElement.previousSibling;
    while (siblingElement?.lastChild && !this.isTransitionalElement(siblingElement)) {
      siblingElement = siblingElement.lastChild;
    }

    if (this.isTransitionalElement(siblingElement)) {
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

  private getElementValue(element: FormElement): string {
    if (element instanceof HTMLSpanElement) {
      return element.innerText;
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
}

export default AutofillCollect;

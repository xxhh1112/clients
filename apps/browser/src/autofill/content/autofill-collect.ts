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
        htmlAction: new URL(formElement.action, window.location.href).href,
        htmlName: formElement.name,
        htmlID: formElement.id,
        htmlMethod: formElement.method,
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

  private getAutofillFieldElements(fieldsLimit?: number): FormElement[] {
    const formFieldElements: FormElement[] = [
      ...(document.querySelectorAll(
        'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]):not([type="file"]):not([data-bwignore]), ' +
          "span[data-bwautofill], " +
          // @TODO `select` and `textarea` should also have `data-bwignore` qualifier
          "select, " +
          "textarea"
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

      const fieldType = this.getElementAttribute(element, "type").toLowerCase();
      if (unimportantFieldTypesSet.has(fieldType)) {
        unimportantFormFields.push(element);
        continue;
      }

      priorityFormFields.push(element);
    }

    const numberOfUnimportantFieldsToInclude = fieldsLimit - priorityFormFields.length;
    if (numberOfUnimportantFieldsToInclude > 0) {
      priorityFormFields.concat(unimportantFormFields.slice(0, numberOfUnimportantFieldsToInclude));
    }

    return priorityFormFields;
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
      htmlID: this.getElementAttribute(element, "id"),
      htmlName: this.getElementAttribute(element, "name"),
      htmlClass: this.getElementAttribute(element, "class"),
      tabindex: this.getElementAttribute(element, "tabindex"),
      title: this.getElementAttribute(element, "title"),
      tagName: element.tagName.toLowerCase(),
    };

    if (element instanceof HTMLSpanElement) {
      return this.generateAutofillFieldDataContainer(autofillFieldBase);
    }

    const autoCompleteType =
      this.getElementAttribute(element, "x-autocompletetype") ||
      this.getElementAttribute(element, "autocompletetype") ||
      this.getElementAttribute(element, "autocomplete");
    const elementHasReadOnlyProperty =
      element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
    let autofillFieldLabels = {};
    const elementType = String(element.type);
    if (elementType.toLowerCase() !== "hidden") {
      autofillFieldLabels = {
        "label-tag": this.getAutofillFieldLabelTag(element),
        "label-data": this.getElementAttribute(element, "data-label"),
        "label-aria": this.getElementAttribute(element, "aria-label"),
        "label-top": getLabelTop(element),
        "label-right": this.createAutofillFieldRightLabel(element),
        "label-left": this.createAutofillFieldLeftLabel(element),
        placeholder: this.getElementAttribute(element, "placeholder"),
      };
    }

    return this.generateAutofillFieldDataContainer({
      ...autofillFieldBase,
      ...autofillFieldLabels,
      rel: this.getElementAttribute(element, "rel"),
      type: elementType,
      value: this.getElementValue(element),
      checked: Boolean(this.getElementAttribute(element, "checked")),
      autoCompleteType: autoCompleteType !== "off" ? autoCompleteType : null,
      disabled: Boolean(this.getElementAttribute(element, "disabled")),
      readonly: elementHasReadOnlyProperty ? element.readOnly : false,
      selectInfo: element instanceof HTMLSelectElement ? getSelectElementOptions(element) : null,
      form: element.form ? this.getElementAttribute(element.form, "opid") : null,
      "aria-hidden": this.getElementAttribute(element, "aria-hidden") === "true",
      "aria-disabled": this.getElementAttribute(element, "aria-disabled") === "true",
      "aria-haspopup": this.getElementAttribute(element, "aria-haspopup") === "true",
      "data-stripe": this.getElementAttribute(element, "data-stripe"),
    });
  };

  private generateAutofillFieldDataContainer(dataOverrides: Record<string, any>): AutofillField {
    return {
      opid: undefined,
      elementNumber: undefined,
      maxLength: undefined,
      visible: undefined,
      viewable: undefined,
      htmlID: undefined,
      htmlName: undefined,
      htmlClass: undefined,
      tabindex: undefined,
      title: undefined,
      tagName: undefined,
      "label-tag": undefined,
      "label-data": undefined,
      "label-aria": undefined,
      "label-top": undefined,
      "label-right": undefined,
      "label-left": undefined,
      placeholder: undefined,
      rel: undefined,
      type: undefined,
      value: undefined,
      checked: undefined,
      autoCompleteType: undefined,
      disabled: undefined,
      readonly: undefined,
      selectInfo: undefined,
      form: undefined,
      "aria-hidden": undefined,
      "aria-disabled": undefined,
      "aria-haspopup": undefined,
      "data-stripe": undefined,
      ...dataOverrides,
    };
  }

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

  /**
   * Check if the element's tag indicates that a transition to a new section of the
   * page is occurring. If so, we should not use the element or its children in order
   * to get autofill context for the previous element.
   * @param {HTMLElement} currentElement
   * @returns {boolean}
   * @private
   */
  private isTransitionalElement(currentElement: HTMLElement): boolean {
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
    return transitionalElementTagsSet.has(currentElement.tagName.toLowerCase());
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

  private recursivelyGetTextFromPreviousSiblings(element: FormElement): string[] {
    const textContentItems: string[] = [];
    let currentElement: HTMLElement | null = element;
    while (currentElement && currentElement.previousElementSibling) {
      currentElement = currentElement.previousElementSibling as HTMLElement;

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

    currentElement = currentElement.parentElement;
    let siblingElement = currentElement.previousElementSibling as HTMLElement | null;
    while (siblingElement?.lastElementChild && !this.isTransitionalElement(siblingElement)) {
      siblingElement = siblingElement.lastElementChild as HTMLElement;
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

  private getElementAttribute(element: FormElement, attributeName: string): string {
    if (attributeName in element) {
      return (element as FormElementWithAttribute)[attributeName] || "";
    }

    return element.getAttribute(attributeName) || "";
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

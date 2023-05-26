import AutofillField from "../models/autofill-field";
import AutofillForm from "../models/autofill-form";
import AutofillPageDetails from "../models/autofill-page-details";
import { ElementWithOpId, FillableControl, FormElement } from "../types";
import {
  generateAutofillFieldData,
  getElementAttrValue,
  getElementValue,
  getFormElements,
  getLabelTop,
  getSelectElementOptions,
  isElementViewable,
  isElementVisible,
} from "../utils";

class AutofillCollect {
  private autofillFormsData: AutofillForm[] = [];
  private autofillFieldsData: AutofillField[] = [];
  private readonly queriedFieldsLimit = 50;

  /**
   * Builds the data for all the forms and fields that
   * are found within the page DOM.
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
      forms: this.buildPageDetailsFormData(this.autofillFormsData),
      fields: this.autofillFieldsData,
      collectedTimestamp: Date.now(),
    };
  }

  private buildAutofillFieldsData(): AutofillField[] {
    const formElements = getFormElements(document, this.queriedFieldsLimit);

    return [...formElements].map((element: ElementWithOpId<FormElement>, index: number) => {
      const fieldOpid = `__${index}`;
      element.opid = fieldOpid;

      let autofillField: AutofillField = generateAutofillFieldData({
        opid: fieldOpid,
        elementNumber: index,
        maxLength: this.getAutofillFieldMaxLength(element),
        visible: isElementVisible(element),
        viewable: isElementViewable(element),
        htmlID: getElementAttrValue(element, "id"),
        htmlName: getElementAttrValue(element, "name"),
        htmlClass: getElementAttrValue(element, "class"),
        tabindex: getElementAttrValue(element, "tabindex"),
        title: getElementAttrValue(element, "title"),
        tagName: element.tagName.toLowerCase(),
      });

      if (element instanceof HTMLSpanElement) {
        return autofillField;
      }

      const autoCompleteType =
        element.getAttribute("x-autocompletetype") ||
        element.getAttribute("autocompletetype") ||
        element.getAttribute("autocomplete");
      const elementHasReadOnlyProperty =
        element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
      const elementType = String(element.type);
      if (elementType.toLowerCase() !== "hidden") {
        autofillField = {
          ...autofillField,
          "label-tag": this.getAutofillFieldLabelTag(element),
          "label-data": getElementAttrValue(element, "data-label"),
          "label-aria": getElementAttrValue(element, "aria-label"),
          "label-top": getLabelTop(element),
          "label-right": this.createAutofillFieldRightLabel(element),
          "label-left": this.createAutofillFieldLeftLabel(element),
          placeholder: getElementAttrValue(element, "placeholder"),
        };
      }

      return {
        ...autofillField,
        rel: getElementAttrValue(element, "rel"),
        type: elementType,
        value: getElementValue(element),
        checked: Boolean(getElementAttrValue(element, "checked")),
        autoCompleteType: autoCompleteType !== "off" ? autoCompleteType : null,
        disabled: Boolean(getElementAttrValue(element, "disabled")),
        readonly: elementHasReadOnlyProperty ? element.readOnly : false,
        selectInfo: element instanceof HTMLSelectElement ? getSelectElementOptions(element) : null,
        form: element.form ? getElementAttrValue(element.form, "opid") : null,
        "aria-hidden": element.getAttribute("aria-hidden") === "true",
        "aria-disabled": element.getAttribute("aria-disabled") === "true",
        "aria-haspopup": element.getAttribute("aria-haspopup") === "true",
        "data-stripe": getElementAttrValue(element, "data-stripe"),
      };
    });
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

    let labelQuerySelectors = element.id ? `label[for="${element.id}"]` : "";
    if (element.name) {
      const forElementNameSelector = `label[for="${element.name}"]`;
      labelQuerySelectors = labelQuerySelectors
        ? `${labelQuerySelectors}, ${forElementNameSelector}`
        : forElementNameSelector;
    }

    if (labelQuerySelectors) {
      const labelElements: NodeListOf<HTMLLabelElement> =
        document.querySelectorAll(labelQuerySelectors);
      labelElements.forEach((labelElement) => labelElementsSet.add(labelElement));
    }

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
        return (textContent || "")
          .replace(/^\s+|\s+$/g, "") // trim leading and trailing whitespace
          .replace(/\s{2,}/g, " "); // replace multiple spaces with a single space
      })
      .join("");
  };

  private buildAutofillFormsData(): AutofillForm[] {
    const documentFormElements = document.querySelectorAll("form");

    return [...documentFormElements].map((formElement: HTMLFormElement, index: number) => {
      const formOpid = `__form__${index}`;
      formElement.opid = formOpid;

      return {
        opid: formOpid,
        htmlAction: new URL(formElement.action, window.location.href).href,
        htmlName: getElementAttrValue(formElement, "name"),
        htmlID: getElementAttrValue(formElement, "id"),
        htmlMethod: getElementAttrValue(formElement, "method"),
      };
    });
  }

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
    const labelTextContent: string[] =
      this.recursivelyGetTextContentFromElementPreviousSiblings(element);

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

  private recursivelyGetTextContentFromElementPreviousSiblings(element: FormElement): string[] {
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
    while (
      siblingElement &&
      siblingElement.lastElementChild &&
      !this.isTransitionalElement(siblingElement)
    ) {
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

    return this.recursivelyGetTextContentFromElementPreviousSiblings(siblingElement);
  }

  private buildPageDetailsFormData(forms: AutofillForm[]): Record<string, AutofillForm> {
    const autofillForm: Record<string, AutofillForm> = {};
    forms.forEach((form) => {
      autofillForm[form.opid] = form;
    });

    return autofillForm;
  }
}

export default AutofillCollect;

import AutofillField from "../models/autofill-field";
import AutofillForm from "../models/autofill-form";
import AutofillPageDetails from "../models/autofill-page-details";
import { ElementWithOpId, FillableControl, FormElement } from "../types";
import {
  checkNodeType,
  generateAutofillFieldData,
  getElementAttrValue,
  getFormElements,
  getLabelTop,
  getSelectElementOptions,
  isElementViewable,
  isElementVisible,
  isKnownTag,
  shiftForLeftLabel,
} from "../utils";

class AutofillCollect {
  private autofillFormsData: AutofillForm[] = [];
  private autofillFieldsData: AutofillField[] = [];
  private readonly queriedFieldsLimit = 50;

  /**
   * Builds the data for all the forms and fields that
   * are found within the page DOM.
   * @param {string} oneShotId
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

  /**
   * Creates a label tag used to autofill the element pulled from a label
   * associated with the element's id, name, parent element or from an
   * associated description term element if no other labels can be found.
   * Returns a string containing all the `innerText` or `textContent`
   * values of the label elements.
   * @param {FillableControl} element
   * @returns {string}
   * @private
   */
  private getElementLabelTag(element: ElementWithOpId<FillableControl>): string {
    let labelElements: NodeListOf<HTMLLabelElement> = element.labels;
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
      labelElements = document.querySelectorAll(labelQuerySelectors);
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
        if (!labelElement) {
          return "";
        }

        const textContent = labelElement.textContent || labelElement.innerText;
        return (textContent || "")
          .trim() // trim whitespace from the beginning and end of the string
          .replace(/^\\s+/, "") // trim instances of "\s" at the beginning of the string
          .replace(/\\s+$/, "") // trim instances of "\s" at the end of the string
          .replace("\\n", "") // trim first instance of a newline character
          .replace(/\\s{2,}/, " "); // replace instances of "\s" in the middle of the string with a single space
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

      if (autofillField.tagName === "span" || element instanceof HTMLSpanElement) {
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
          "label-tag": this.getElementLabelTag(element),
          "label-data": getElementAttrValue(element, "data-label"),
          "label-aria": getElementAttrValue(element, "aria-label"),
          "label-top": getLabelTop(element),
          "label-right": this.createElementRightLabel(element),
          "label-left": this.createElementLeftLabel(element),
          placeholder: getElementAttrValue(element, "placeholder"),
        };
      }

      return {
        ...autofillField,
        rel: getElementAttrValue(element, "rel"),
        type: elementType,
        value: getElementAttrValue(element, "value"),
        checked: Boolean(getElementAttrValue(element, "checked")),
        autoCompleteType: autoCompleteType || "off",
        disabled: Boolean(getElementAttrValue(element, "disabled")),
        readonly: elementHasReadOnlyProperty ? element.readOnly : false,
        selectInfo: element instanceof HTMLSelectElement ? getSelectElementOptions(element) : null,
        form: element.form ? getElementAttrValue(element.form, "opid") : null,
        "aria-hidden": element.getAttribute("aria-hidden") == "true",
        "aria-disabled": element.getAttribute("aria-disabled") == "true",
        "aria-haspopup": element.getAttribute("aria-haspopup") == "true",
        "data-stripe": getElementAttrValue(element, "data-stripe"),
      };
    });
  }

  private getAutofillFieldMaxLength(element: ElementWithOpId<FormElement>): number {
    const elementHasMaxLengthProperty =
      element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
    const elementMaxLength =
      elementHasMaxLengthProperty && Number(element.maxLength) > -1
        ? Number(element.maxLength)
        : 999;

    return Math.min(elementMaxLength, 999);
  }

  private createElementRightLabel(element: ElementWithOpId<FormElement>): string {
    const labelTextContent: string[] = [];
    let currentElement = element;

    while (currentElement && currentElement.nextElementSibling) {
      currentElement = currentElement.nextElementSibling as ElementWithOpId<HTMLElement>;
      if (isKnownTag(currentElement)) {
        break;
      }

      checkNodeType(labelTextContent, currentElement);
    }

    return labelTextContent.join("");
  }

  private createElementLeftLabel(element: ElementWithOpId<FormElement>): string {
    const labelTextContent: string[] = [];
    shiftForLeftLabel(element, labelTextContent);

    return labelTextContent.reverse().join("");
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

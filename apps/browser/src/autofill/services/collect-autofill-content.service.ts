import AutofillField from "../models/autofill-field";
import AutofillForm from "../models/autofill-form";
import AutofillPageDetails from "../models/autofill-page-details";
import {
  ElementWithOpId,
  FillableFormFieldElement,
  FormFieldElement,
  FormElementWithAttribute,
} from "../types";

import {
  AttributeUpdateParams,
  AutofillFieldElements,
  AutofillFormElements,
  CollectAutofillContentService as CollectAutofillContentServiceInterface,
} from "./abstractions/collect-autofill-content.service";
import DomElementVisibilityService from "./dom-element-visibility.service";

class CollectAutofillContentService implements CollectAutofillContentServiceInterface {
  private readonly domElementVisibilityService: DomElementVisibilityService;
  private noFieldsFound = false;
  private domRecentlyMutated = true;
  private autofillFormElements: AutofillFormElements = new Map();
  private autofillFieldElements: AutofillFieldElements = new Map();
  private mutationObserver: MutationObserver | null = null;

  constructor(domElementVisibilityService: DomElementVisibilityService) {
    this.domElementVisibilityService = domElementVisibilityService;

    // Setup Mutation Observer
  }

  /**
   * Builds the data for all the forms and fields
   * that are found within the page DOM.
   * @returns {Promise<AutofillPageDetails>}
   * @public
   */
  async getPageDetails(): Promise<AutofillPageDetails> {
    if (!this.mutationObserver) {
      this.setupMutationObserver();
    }

    if (!this.domRecentlyMutated && this.noFieldsFound) {
      return this.getFormattedPageDetails({}, []);
    }

    if (
      !this.domRecentlyMutated &&
      this.autofillFormElements.size &&
      this.autofillFieldElements.size
    ) {
      return this.getFormattedPageDetails(
        this.getFormattedAutofillFormsData(),
        this.getFormattedAutofillFieldsData()
      );
    }

    const { formElements, formFieldElements } = this.queryAutofillFormAndFieldElements();
    const autofillFormsData: Record<string, AutofillForm> =
      this.buildAutofillFormsData(formElements);
    const autofillFieldsData: AutofillField[] = await this.buildAutofillFieldsData(
      formFieldElements as FormFieldElement[]
    );

    if (!Object.values(autofillFormsData).length || !autofillFieldsData.length) {
      this.noFieldsFound = true;
    }

    this.domRecentlyMutated = false;
    return this.getFormattedPageDetails(autofillFormsData, autofillFieldsData);
  }

  private getFormattedPageDetails(
    autofillFormsData: Record<string, AutofillForm>,
    autofillFieldsData: AutofillField[]
  ): AutofillPageDetails {
    return {
      title: document.title,
      url: (document.defaultView || window).location.href,
      documentUrl: document.location.href,
      forms: autofillFormsData,
      fields: autofillFieldsData,
      collectedTimestamp: Date.now(),
    };
  }

  /**
   * Find an AutofillField element by its opid, will only return the first
   * element if there are multiple elements with the same opid. If no
   * element is found, null will be returned.
   * @param {string} opid
   * @returns {FormFieldElement | null}
   */
  getAutofillFieldElementByOpid(opid: string): FormFieldElement | null {
    const cachedFormFieldElements = Array.from(this.autofillFieldElements.keys());
    const formFieldElements = cachedFormFieldElements?.length
      ? cachedFormFieldElements
      : this.getAutofillFieldElements();
    const fieldElementsWithOpid = formFieldElements.filter(
      (fieldElement) => (fieldElement as ElementWithOpId<FormFieldElement>).opid === opid
    ) as ElementWithOpId<FormFieldElement>[];

    if (!fieldElementsWithOpid.length) {
      const elementIndex = parseInt(opid.split("__")[1], 10);

      return formFieldElements[elementIndex] || null;
    }

    if (fieldElementsWithOpid.length > 1) {
      // eslint-disable-next-line no-console
      console.warn(`More than one element found with opid ${opid}`);
    }

    return fieldElementsWithOpid[0];
  }

  /**
   * Queries the DOM for all the forms elements and
   * returns a collection of AutofillForm objects.
   * @returns {Record<string, AutofillForm>}
   * @private
   */
  private buildAutofillFormsData(formElements: Node[]): Record<string, AutofillForm> {
    formElements.forEach(this.addToAutofillFormElementsSet);
    return this.getFormattedAutofillFormsData();
  }

  addToAutofillFormElementsSet = (formElement: HTMLFormElement, index: number) => {
    const existingAutofillForm = this.autofillFormElements.get(
      formElement as ElementWithOpId<HTMLFormElement>
    );
    if (existingAutofillForm) {
      return;
    }

    formElement.opid = `__form__${index}`;
    this.updateFormElementData(formElement);
  };

  private updateFormElementData = (formElement: HTMLFormElement) => {
    this.autofillFormElements.set(formElement as ElementWithOpId<HTMLFormElement>, {
      opid: formElement.opid,
      htmlAction: this.getFormActionAttribute(formElement as ElementWithOpId<HTMLFormElement>),
      htmlName: this.getPropertyOrAttribute(formElement, "name"),
      htmlID: this.getPropertyOrAttribute(formElement, "id"),
      htmlMethod: this.getPropertyOrAttribute(formElement, "method"),
    });
  };

  private getFormattedAutofillFormsData(): Record<string, AutofillForm> {
    const autofillForms: Record<string, AutofillForm> = {};
    this.autofillFormElements.forEach((autofillForm, formElement) => {
      autofillForms[formElement.opid] = autofillForm;
    });

    return autofillForms;
  }

  /**
   * Queries the DOM for all the field elements and
   * returns a list of AutofillField objects.
   * @returns {Promise<AutofillField[]>}
   * @private
   */
  private async buildAutofillFieldsData(
    formFieldElements: FormFieldElement[]
  ): Promise<AutofillField[]> {
    const autofillFieldElements = this.getAutofillFieldElements(50, formFieldElements);
    const autofillFieldDataPromises = autofillFieldElements.map(this.buildAutofillFieldItem);

    return Promise.all(autofillFieldDataPromises);
  }

  /**
   * Queries the DOM for all the field elements that can be autofilled,
   * and returns a list limited to the given `fieldsLimit` number that
   * is ordered by priority.
   * @param {number} fieldsLimit - The maximum number of fields to return
   * @param {FormFieldElement[]} previouslyFoundFormFieldElements - The list of all the field elements
   * @returns {FormFieldElement[]}
   * @private
   */
  private getAutofillFieldElements(
    fieldsLimit?: number,
    previouslyFoundFormFieldElements?: FormFieldElement[]
  ): FormFieldElement[] {
    const formFieldElements =
      previouslyFoundFormFieldElements ||
      (this.queryAllTreeWalkerNodes(document.documentElement, (node: Node) =>
        this.isNodeFormFieldElement(node)
      ) as FormFieldElement[]);

    if (!fieldsLimit || formFieldElements.length <= fieldsLimit) {
      return formFieldElements;
    }

    const priorityFormFields: FormFieldElement[] = [];
    const unimportantFormFields: FormFieldElement[] = [];
    const unimportantFieldTypesSet = new Set(["checkbox", "radio"]);
    for (const element of formFieldElements) {
      if (priorityFormFields.length >= fieldsLimit) {
        return priorityFormFields;
      }

      const fieldType = this.getPropertyOrAttribute(element, "type")?.toLowerCase();
      if (unimportantFieldTypesSet.has(fieldType)) {
        unimportantFormFields.push(element);
        continue;
      }

      priorityFormFields.push(element);
    }

    const numberUnimportantFieldsToInclude = fieldsLimit - priorityFormFields.length;
    for (let index = 0; index < numberUnimportantFieldsToInclude; index++) {
      priorityFormFields.push(unimportantFormFields[index]);
    }

    return priorityFormFields;
  }

  /**
   * Builds an AutofillField object from the given form element. Will only return
   * shared field values if the element is a span element. Will not return any label
   * values if the element is a hidden input element.
   * @param {ElementWithOpId<FormFieldElement>} element
   * @param {number} index
   * @returns {Promise<AutofillField>}
   * @private
   */
  private buildAutofillFieldItem = async (
    element: ElementWithOpId<FormFieldElement>,
    index: number
  ): Promise<AutofillField> => {
    const existingAutofillField = this.autofillFieldElements.get(element);
    if (existingAutofillField) {
      return existingAutofillField;
    }

    element.opid = `__${index}`;

    const autofillFieldBase = {
      opid: element.opid,
      elementNumber: index,
      maxLength: this.getAutofillFieldMaxLength(element),
      viewable: await this.domElementVisibilityService.isFormFieldViewable(element),
      htmlID: this.getPropertyOrAttribute(element, "id"),
      htmlName: this.getPropertyOrAttribute(element, "name"),
      htmlClass: this.getPropertyOrAttribute(element, "class"),
      tabindex: this.getPropertyOrAttribute(element, "tabindex"),
      title: this.getPropertyOrAttribute(element, "title"),
      tagName: this.getPropertyOrAttribute(element, "tagName")?.toLowerCase(),
    };

    if (element instanceof HTMLSpanElement) {
      this.autofillFieldElements.set(element, autofillFieldBase);
      return autofillFieldBase;
    }

    let autofillFieldLabels = {};
    const autoCompleteType =
      this.getPropertyOrAttribute(element, "x-autocompletetype") ||
      this.getPropertyOrAttribute(element, "autocompletetype") ||
      this.getPropertyOrAttribute(element, "autocomplete");
    const elementType = this.getPropertyOrAttribute(element, "type")?.toLowerCase();
    if (elementType !== "hidden") {
      autofillFieldLabels = {
        "label-tag": this.createAutofillFieldLabelTag(element),
        "label-data": this.getPropertyOrAttribute(element, "data-label"),
        "label-aria": this.getPropertyOrAttribute(element, "aria-label"),
        "label-top": this.createAutofillFieldTopLabel(element),
        "label-right": this.createAutofillFieldRightLabel(element), // TODO: This is likely not a useful element... consider removing.
        "label-left": this.createAutofillFieldLeftLabel(element),
        placeholder: this.getPropertyOrAttribute(element, "placeholder"),
      };
    }

    const autofillField = {
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

    this.autofillFieldElements.set(element, autofillField);
    return autofillField;
  };

  private getFormattedAutofillFieldsData(): AutofillField[] {
    const formFieldElements: AutofillField[] = [];
    this.autofillFieldElements.forEach((autofillField) => formFieldElements.push(autofillField));

    return formFieldElements;
  }

  /**
   * Creates a label tag used to autofill the element pulled from a label
   * associated with the element's id, name, parent element or from an
   * associated description term element if no other labels can be found.
   * Returns a string containing all the `textContent` or `innerText`
   * values of the label elements.
   * @param {FillableFormFieldElement} element
   * @returns {string}
   * @private
   */
  private createAutofillFieldLabelTag(element: FillableFormFieldElement): string {
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

      currentElement = currentElement.parentElement.closest("label");
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
   * Queries the DOM for label elements associated with the given element
   * by id or name. Returns a NodeList of label elements or null if none
   * are found.
   * @param {FillableFormFieldElement} element
   * @returns {NodeListOf<HTMLLabelElement> | null}
   * @private
   */
  private queryElementLabels(
    element: FillableFormFieldElement
  ): NodeListOf<HTMLLabelElement> | null {
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

    return (element.getRootNode() as Document | ShadowRoot).querySelectorAll(labelQuerySelectors);
  }

  /**
   * Map over all the label elements and creates a
   * string of the text content of each label element.
   * @param {Set<HTMLElement>} labelElementsSet
   * @returns {string}
   * @private
   */
  private createLabelElementsTag = (labelElementsSet: Set<HTMLElement>): string => {
    return Array.from(labelElementsSet)
      .map((labelElement) => {
        const textContent: string | null = labelElement
          ? labelElement.textContent || labelElement.innerText
          : null;

        return this.trimAndRemoveNonPrintableText(textContent || "");
      })
      .join("");
  };

  /**
   * Gets the maxLength property of the passed FormFieldElement and
   * returns the value or null if the element does not have a
   * maxLength property. If the element has a maxLength property
   * greater than 999, it will return 999.
   * @param {FormFieldElement} element
   * @returns {number | null}
   * @private
   */
  private getAutofillFieldMaxLength(element: FormFieldElement): number | null {
    const elementHasMaxLengthProperty =
      element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
    const elementMaxLength =
      elementHasMaxLengthProperty && element.maxLength > -1 ? element.maxLength : 999;

    return elementHasMaxLengthProperty ? Math.min(elementMaxLength, 999) : null;
  }

  /**
   * Iterates over the next siblings of the passed element and
   * returns a string of the text content of each element. Will
   * stop iterating if it encounters a new section element.
   * @param {FormFieldElement} element
   * @returns {string}
   * @private
   */
  private createAutofillFieldRightLabel(element: FormFieldElement): string {
    const labelTextContent: string[] = [];
    let currentElement: ChildNode = element;

    while (currentElement && currentElement.nextSibling) {
      currentElement = currentElement.nextSibling;
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

  /**
   * Recursively gets the text content from an element's previous siblings
   * and returns a string of the text content of each element.
   * @param {FormFieldElement} element
   * @returns {string}
   * @private
   */
  private createAutofillFieldLeftLabel(element: FormFieldElement): string {
    const labelTextContent: string[] = this.recursivelyGetTextFromPreviousSiblings(element);

    return labelTextContent.reverse().join("");
  }

  /**
   * Assumes that the input elements that are to be autofilled are within a
   * table structure. Queries the previous sibling of the parent row that
   * the input element is in and returns the text content of the cell that
   * is in the same column as the input element.
   * @param {FormFieldElement} element
   * @returns {string | null}
   * @private
   */
  private createAutofillFieldTopLabel(element: FormFieldElement): string | null {
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
   * @param {FormFieldElement} element
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
   * Get the value of a property or attribute from a FormFieldElement.
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
   * @param {FormFieldElement} element
   * @returns {string}
   * @private
   */
  private getElementValue(element: FormFieldElement): string {
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
      const inputValueMaxLength = 254;

      return elementValue.length > inputValueMaxLength
        ? `${elementValue.substring(0, inputValueMaxLength)}...SNIPPED`
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
    const options = Array.from(element.options).map((option) => {
      const optionText = option.text
        ? String(option.text)
            .toLowerCase()
            .replace(/[\s~`!@$%^&#*()\-_+=:;'"[\]|\\,<.>?]/gm, "") // Remove whitespace and punctuation
        : null;

      return [optionText, option.value];
    });

    return { options };
  }

  /**
   *
   *
   * @private
   * @return {
   *     formElements: Node[];
   *     formFieldElements: Node[];
   *   }
   * @memberof CollectAutofillContentService
   */
  private queryAutofillFormAndFieldElements(): {
    formElements: Node[];
    formFieldElements: Node[];
  } {
    const formElements: Node[] = [];
    const formFieldElements: Node[] = [];
    this.queryAllTreeWalkerNodes(document.documentElement, (node: Node) => {
      if (node instanceof HTMLFormElement) {
        formElements.push(node);
        return true;
      }

      if (this.isNodeFormFieldElement(node)) {
        formFieldElements.push(node);
        return true;
      }

      return false;
    });

    return { formElements, formFieldElements };
  }

  /**
   *
   *
   * @private
   * @param {Node} node
   * @return boolean
   * @memberof CollectAutofillContentService
   */
  private isNodeFormFieldElement(node: Node): boolean {
    const nodeIsSpanElementWithAutofillAttribute =
      node instanceof HTMLSpanElement && node.hasAttribute("data-bwautofill");

    const ignoredInputTypes = new Set(["hidden", "submit", "reset", "button", "image", "file"]);
    const nodeIsValidInputElement =
      node instanceof HTMLInputElement && !ignoredInputTypes.has(node.type);

    const nodeIsTextAreaOrSelectElement =
      node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement;

    const nodeIsNonIgnoredFillableControlElement =
      (nodeIsTextAreaOrSelectElement || nodeIsValidInputElement) &&
      !node.hasAttribute("data-bwignore");

    return nodeIsSpanElementWithAutofillAttribute || nodeIsNonIgnoredFillableControlElement;
  }

  /**
   *
   *
   * @private
   * @param {Node} node
   * @return ShadowRoot | null
   * @memberof CollectAutofillContentService
   */
  private getShadowRoot(node: Node): ShadowRoot | null {
    if (!(node instanceof HTMLElement)) {
      return null;
    }

    if ((chrome as any).dom?.openOrClosedShadowRoot) {
      return (chrome as any).dom.openOrClosedShadowRoot(node);
    }

    return (node as any).openOrClosedShadowRoot || node.shadowRoot;
  }

  queryAllTreeWalkerNodes(rootNode: Node, filterCallback: CallableFunction): Node[] {
    const treeWalkerQueryResults: Node[] = [];

    this.buildTreeWalkerNodesQueryResults(rootNode, treeWalkerQueryResults, filterCallback);

    return treeWalkerQueryResults;
  }

  /**
   *
   *
   * @param {Node} rootNode
   * @param {Node[]} treeWalkerQueryResults
   * @param {CallableFunction} filterCallback
   * @memberof CollectAutofillContentService
   */
  buildTreeWalkerNodesQueryResults(
    rootNode: Node,
    treeWalkerQueryResults: Node[],
    filterCallback: CallableFunction
  ) {
    const treeWalker = document.createTreeWalker(rootNode, NodeFilter.SHOW_ELEMENT);
    let currentNode = treeWalker.currentNode;

    while (currentNode) {
      if (filterCallback(currentNode)) {
        treeWalkerQueryResults.push(currentNode);
      }

      const nodeShadowRoot = this.getShadowRoot(currentNode);
      if (nodeShadowRoot) {
        this.mutationObserver.observe(nodeShadowRoot, {
          attributes: true,
          childList: true,
          subtree: true,
        });
        this.buildTreeWalkerNodesQueryResults(
          nodeShadowRoot,
          treeWalkerQueryResults,
          filterCallback
        );
      }

      currentNode = treeWalker.nextNode();
    }
  }

  private setupMutationObserver() {
    this.mutationObserver = new MutationObserver(this.handleMutationObserverMutation);
    this.mutationObserver.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  private handleMutationObserverMutation = async (mutations: MutationRecord[]) => {
    for (let mutationsIndex = 0; mutationsIndex < mutations.length; mutationsIndex++) {
      const mutation = mutations[mutationsIndex];
      if (mutation.type === "childList" && this.isAutofillElementMutation(mutation)) {
        this.domRecentlyMutated = true;
        this.noFieldsFound = false;
        return;
      }

      if (mutation.type !== "attributes") {
        continue;
      }

      this.handleAutofillElementAttributeMutation(mutation);
    }
  };

  private isAutofillElementMutation = (mutation: MutationRecord): boolean => {
    return (
      this.isAutofillElementNodeMutated(mutation.removedNodes) ||
      this.isAutofillElementNodeMutated(mutation.addedNodes)
    );
  };

  private isAutofillElementNodeMutated = (nodes: NodeList): boolean => {
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      if (!(node instanceof HTMLElement)) {
        continue;
      }

      if (node instanceof HTMLFormElement || this.isNodeFormFieldElement(node)) {
        return true;
      }

      const childNodes = this.queryAllTreeWalkerNodes(
        node,
        (node: Node) => node instanceof HTMLFormElement || this.isNodeFormFieldElement(node)
      ) as HTMLElement[];
      if (childNodes.length) {
        return true;
      }
    }

    return false;
  };

  private handleAutofillElementAttributeMutation = (mutation: MutationRecord) => {
    const targetElement = mutation.target;
    if (!(targetElement instanceof HTMLElement)) {
      return;
    }

    const attributeName = mutation.attributeName?.toLowerCase();
    const autofillForm = this.autofillFormElements.get(
      targetElement as ElementWithOpId<HTMLFormElement>
    );

    if (autofillForm) {
      this.updateAutofillFormElementData(
        attributeName,
        targetElement as ElementWithOpId<HTMLFormElement>,
        autofillForm
      );

      return;
    }

    const autofillField = this.autofillFieldElements.get(
      targetElement as ElementWithOpId<FormFieldElement>
    );
    if (autofillField) {
      this.updateAutofillFieldElementData(
        attributeName,
        targetElement as ElementWithOpId<FormFieldElement>,
        autofillField
      );
      return;
    }
  };

  private updateAutofillFormElementData = (
    attributeName: string,
    element: ElementWithOpId<HTMLFormElement>,
    dataTarget: AutofillForm
  ) => {
    const updateAttribute = (dataTargetKey: string) => {
      this.updateAutofillDataAttribute({
        element,
        attributeName,
        dataTarget,
        dataTargetKey,
      });
    };
    const updateActions: Record<string, CallableFunction> = {
      action: () => (dataTarget.htmlAction = this.getFormActionAttribute(element)),
      name: () => updateAttribute("htmlName"),
      id: () => updateAttribute("htmlID"),
      method: () => updateAttribute("htmlMethod"),
    };

    if (!updateActions[attributeName]) {
      return;
    }
    updateActions[attributeName]();
    this.autofillFormElements.set(element, dataTarget);
  };

  private updateAutofillFieldElementData = async (
    attributeName: string,
    element: ElementWithOpId<FormFieldElement>,
    dataTarget: AutofillField
  ) => {
    const updateAttribute = (dataTargetKey: string) => {
      this.updateAutofillDataAttribute({
        element,
        attributeName,
        dataTarget,
        dataTargetKey,
      });
    };
    const updateActions: Record<string, CallableFunction> = {
      maxlength: () => (dataTarget.maxLength = this.getAutofillFieldMaxLength(element)),
      id: () => updateAttribute("htmlID"),
      class: () => updateAttribute("htmlClass"),
      tabindex: () => updateAttribute("tabindex"),
      title: () => updateAttribute("tabindex"),
      rel: () => updateAttribute("rel"),
      tagName: () =>
        (dataTarget.tagName = this.getPropertyOrAttribute(element, "tagName")?.toLowerCase()),
      type: () => (dataTarget.type = this.getPropertyOrAttribute(element, "type")?.toLowerCase()),
      value: () => (dataTarget.value = this.getElementValue(element)),
      checked: () =>
        (dataTarget.checked = Boolean(this.getPropertyOrAttribute(element, "checked"))),
      disabled: () =>
        (dataTarget.disabled = Boolean(this.getPropertyOrAttribute(element, "disabled"))),
      readonly: () =>
        (dataTarget.readonly = Boolean(this.getPropertyOrAttribute(element, "readonly"))),
      autocomplete: () => {
        const autoCompleteType =
          this.getPropertyOrAttribute(element, "x-autocompletetype") ||
          this.getPropertyOrAttribute(element, "autocompletetype") ||
          this.getPropertyOrAttribute(element, "autocomplete");
        dataTarget.autoCompleteType = autoCompleteType !== "off" ? autoCompleteType : null;
      },
      "aria-hidden": () =>
        (dataTarget["aria-hidden"] =
          this.getPropertyOrAttribute(element, "aria-hidden") === "true"),
      "aria-disabled": () =>
        (dataTarget["aria-disabled"] =
          this.getPropertyOrAttribute(element, "aria-disabled") === "true"),
      "aria-haspopup": () =>
        (dataTarget["aria-haspopup"] =
          this.getPropertyOrAttribute(element, "aria-haspopup") === "true"),
      "data-stripe": () => updateAttribute("data-stripe"),
    };

    if (!updateActions[attributeName]) {
      return;
    }

    updateActions[attributeName]();

    const visibilityAttributesSet = new Set(["class", "style"]);
    if (
      visibilityAttributesSet.has(attributeName) &&
      !dataTarget.htmlClass.includes("com-bitwarden-browser-animated-fill")
    ) {
      dataTarget.viewable = await this.domElementVisibilityService.isFormFieldViewable(element);
    }

    this.autofillFieldElements.set(element, dataTarget);
  };

  private updateAutofillDataAttribute = ({
    element,
    attributeName,
    dataTarget,
    dataTargetKey,
  }: AttributeUpdateParams) => {
    const attributeValue = this.getPropertyOrAttribute(element, attributeName);
    if (dataTarget && dataTargetKey) {
      dataTarget[dataTargetKey] = attributeValue;
    }

    return attributeValue;
  };

  private getFormActionAttribute = (element: ElementWithOpId<HTMLFormElement>) => {
    return new URL(this.getPropertyOrAttribute(element, "action"), window.location.href).href;
  };
}

export default CollectAutofillContentService;

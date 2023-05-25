import AutofillPageDetails from "../models/autofill-page-details";
import { FillableControl, FormElement } from "../types";

class AutofillCollect {
  private elementsByOpid: Record<string, FormElement> = {};

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  getPageDetails(): AutofillPageDetails {
    // TODO: implement `collect` method
  }

  /**
   * Creates a label tag used to autofill the element
   * pulled from a label associated with the element's
   * id, name, parent element or from an associated
   * description term element if no other labels
   * can be found.
   *
   * @param {FillableControl} element
   * @returns {string}
   * @private
   */
  private getElementLabelTag(element: FillableControl): string {
    let labelElements: NodeListOf<HTMLLabelElement> = element.labels;
    const labelElementsSet: Set<HTMLElement> = new Set(element.labels);

    // Query the DOM for all label elements associated with the
    // passed selectors and adds them to the `labelElementsSet`.
    const populateLabelElementsFromQuery = (selectors: string): void => {
      labelElements = document.querySelectorAll(selectors);
      labelElements.forEach((labelElement) => labelElementsSet.add(labelElement));
    };

    // Map over all the label elements and creates a
    // string of the text content of each label element.
    const createLabelElementsTag = (): string => {
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

    if (labelElementsSet.size) {
      return createLabelElementsTag();
    }

    if (element.id) {
      populateLabelElementsFromQuery(`label[for="${element.id}"]`);
    }

    if (element.name) {
      populateLabelElementsFromQuery(`label[for="${element.name}"]`);
    }

    let currentElement: HTMLElement | null = element;
    while (currentElement && currentElement !== document.documentElement) {
      if (currentElement.tagName.toLowerCase() === "label") {
        labelElementsSet.add(currentElement as HTMLLabelElement);
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

    return createLabelElementsTag();
  }
}

export default AutofillCollect;

import { FillableFormFieldElement, FormFieldElement } from "../types";

import { DomElementVisibilityService as domElementVisibilityServiceInterface } from "./abstractions/dom-element-visibility.service";

class DomElementVisibilityService implements domElementVisibilityServiceInterface {
  private cachedComputedStyle: CSSStyleDeclaration | null = null;

  /**
   * Checks if a form field is viewable. This is done by checking if the element is within the
   * viewport bounds, not hidden by CSS, and not hidden behind another element.
   * @param {FormFieldElement} element
   * @returns {Promise<boolean>}
   */
  async isFormFieldViewable(element: FormFieldElement): Promise<boolean> {
    const elementObserverEntry = await this.getElementIntersectionObserverEntry(element);
    const elementBoundingClientRect =
      elementObserverEntry?.boundingClientRect || element.getBoundingClientRect();
    if (
      (elementObserverEntry && !elementObserverEntry.isIntersecting) ||
      this.isElementOutsideViewportBounds(element, elementBoundingClientRect) ||
      this.isElementHiddenByCss(element)
    ) {
      return false;
    }

    return this.formFieldIsNotHiddenBehindAnotherElement(element, elementBoundingClientRect);
  }

  /**
   * Check if the target element is hidden using CSS. This is done by checking the opacity, display,
   * visibility, and clip-path CSS properties of the element. We also check the opacity of all
   * parent elements to ensure that the target element is not hidden by a parent element.
   * @param {HTMLElement} element
   * @returns {boolean}
   * @public
   */
  isElementHiddenByCss(element: HTMLElement): boolean {
    this.cachedComputedStyle = null;

    if (
      this.isElementInvisible(element) ||
      this.isElementNotDisplayed(element) ||
      this.isElementNotVisible(element) ||
      this.isElementClipped(element)
    ) {
      return true;
    }

    let parentElement = element.parentElement;
    while (parentElement && parentElement !== element.ownerDocument.documentElement) {
      this.cachedComputedStyle = null;
      if (this.isElementInvisible(parentElement)) {
        return true;
      }

      parentElement = parentElement.parentElement;
    }

    return false;
  }

  private getElementStyle(element: HTMLElement, styleProperty: string): string {
    const inlineStyle = element.style.getPropertyValue(styleProperty);
    if (inlineStyle) {
      return inlineStyle;
    }

    if (!this.cachedComputedStyle) {
      this.cachedComputedStyle = (element.ownerDocument.defaultView || window).getComputedStyle(
        element
      );
    }

    return this.cachedComputedStyle.getPropertyValue(styleProperty);
  }

  private isElementInvisible(element: HTMLElement): boolean {
    return parseFloat(this.getElementStyle(element, "opacity")) < 0.1;
  }

  private isElementNotDisplayed(element: HTMLElement): boolean {
    return this.getElementStyle(element, "display") === "none";
  }

  private isElementNotVisible(element: HTMLElement): boolean {
    return new Set(["hidden", "collapse"]).has(this.getElementStyle(element, "visibility"));
  }

  private isElementClipped(element: HTMLElement): boolean {
    return new Set([
      "inset(50%)",
      "inset(100%)",
      "circle(0)",
      "circle(0px)",
      "circle(0px at 50% 50%)",
      "polygon(0 0, 0 0, 0 0, 0 0)",
      "polygon(0px 0px, 0px 0px, 0px 0px, 0px 0px)",
    ]).has(this.getElementStyle(element, "clipPath"));
  }

  private isElementOutsideViewportBounds(
    element: HTMLElement,
    elementBoundingClientRect: DOMRectReadOnly | null = null
  ): boolean {
    const documentElement = element.ownerDocument.documentElement;
    const documentElementWidth = documentElement.scrollWidth;
    const documentElementHeight = documentElement.scrollHeight;
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

  private formFieldIsNotHiddenBehindAnotherElement(
    element: FormFieldElement,
    elementBoundingClientRect: DOMRectReadOnly
  ): boolean {
    // If the element is intersecting, we need to check if it is actually visible on the page. Check the center
    // point of the element and use elementFromPoint to see if the element is actually returned as the
    // element at that point. If it is not, the element is not viewable.
    let elementAtCenterPoint = element.ownerDocument.elementFromPoint(
      elementBoundingClientRect.left + elementBoundingClientRect.width / 2,
      elementBoundingClientRect.top + elementBoundingClientRect.height / 2
    );
    if (elementAtCenterPoint === element) {
      return true;
    }

    //  If the element at the center point is a label, check if the label is for the element.
    //  If it is, the element is viewable. If it is not, the element is not viewable.
    while (elementAtCenterPoint && elementAtCenterPoint instanceof HTMLLabelElement) {
      const labelsSet = new Set((element as FillableFormFieldElement).labels);
      if (labelsSet.has(elementAtCenterPoint)) {
        return true;
      }

      elementAtCenterPoint = elementAtCenterPoint.closest("label");
    }

    return false;
  }

  private async getElementIntersectionObserverEntry(
    element: HTMLElement
  ): Promise<IntersectionObserverEntry | null> {
    if (
      !("IntersectionObserver" in window) ||
      !("IntersectionObserverEntry" in window) ||
      !("intersectionRatio" in window.IntersectionObserverEntry.prototype) ||
      !("isIntersecting" in window.IntersectionObserverEntry.prototype)
    ) {
      return null;
    }

    return new Promise((resolve) => {
      const observer = new IntersectionObserver(
        (entries) => {
          resolve(entries[0]);
          observer.disconnect();
        },
        { root: element.ownerDocument.body, threshold: 0.999 }
      );
      observer.observe(element);
    });
  }
}

export default DomElementVisibilityService;

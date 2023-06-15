import { mock } from "jest-mock-extended";

import { FormFieldElement } from "../types";

import DomElementVisibilityService from "./dom-element-visibility.service";

function createBoundingClientRectMock(customProperties: Partial<any> = {}): DOMRectReadOnly {
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 500,
    height: 500,
    x: 0,
    y: 0,
    toJSON: jest.fn(),
    ...customProperties,
  };
}

function createIntersectObserverEntryMock(
  customerProperties: Partial<IntersectionObserverEntry> = {}
): IntersectionObserverEntry {
  return {
    target: mock<HTMLElement>(),
    boundingClientRect: createBoundingClientRectMock({}),
    intersectionRatio: 1,
    isIntersecting: true,
    intersectionRect: mock<DOMRectReadOnly>(),
    rootBounds: mock<DOMRectReadOnly>(),
    time: 0,
    ...customerProperties,
  };
}

describe("DomElementVisibilityService", function () {
  let domElementVisibilityService: DomElementVisibilityService;

  beforeEach(function () {
    jest.clearAllMocks();
    document.body.innerHTML = `
      <form id="root">
        <label for="username">Username</label>
        <input type="text" name="username" id="username">
        <label for="password">Password</label>
        <input type="password" name="password" id="password">
      </form>
    `;
    domElementVisibilityService = new DomElementVisibilityService();
  });

  describe("isFormFieldViewable", function () {
    it("returns false if the form field has an intersection observer entry that is currently not intersecting", async function () {
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;
      const mockIntersectionObserverEntry = createIntersectObserverEntryMock({
        target: usernameElement,
        isIntersecting: false,
      });
      jest
        .spyOn(domElementVisibilityService as any, "getElementIntersectionObserverEntry")
        .mockResolvedValueOnce(mockIntersectionObserverEntry);
      jest.spyOn(usernameElement, "getBoundingClientRect");
      jest.spyOn(domElementVisibilityService as any, "isElementOutsideViewportBounds");
      jest.spyOn(domElementVisibilityService, "isElementHiddenByCss");
      jest.spyOn(domElementVisibilityService as any, "formFieldIsNotHiddenBehindAnotherElement");

      const isFormFieldViewable = await domElementVisibilityService.isFormFieldViewable(
        usernameElement
      );

      expect(isFormFieldViewable).toEqual(false);
      expect(
        domElementVisibilityService["getElementIntersectionObserverEntry"]
      ).toHaveBeenCalledWith(usernameElement);
      expect(usernameElement.getBoundingClientRect).not.toHaveBeenCalled();
      expect(domElementVisibilityService["isElementOutsideViewportBounds"]).not.toHaveBeenCalled();
      expect(domElementVisibilityService["isElementHiddenByCss"]).not.toHaveBeenCalled();
      expect(
        domElementVisibilityService["formFieldIsNotHiddenBehindAnotherElement"]
      ).not.toHaveBeenCalled();
    });

    it("returns false if the element is outside viewport bounds", async function () {
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;
      jest
        .spyOn(domElementVisibilityService as any, "getElementIntersectionObserverEntry")
        .mockResolvedValueOnce(null);
      jest.spyOn(usernameElement, "getBoundingClientRect");
      jest
        .spyOn(domElementVisibilityService as any, "isElementOutsideViewportBounds")
        .mockResolvedValueOnce(true);
      jest.spyOn(domElementVisibilityService, "isElementHiddenByCss");
      jest.spyOn(domElementVisibilityService as any, "formFieldIsNotHiddenBehindAnotherElement");

      const isFormFieldViewable = await domElementVisibilityService.isFormFieldViewable(
        usernameElement
      );

      expect(isFormFieldViewable).toEqual(false);
      expect(
        domElementVisibilityService["getElementIntersectionObserverEntry"]
      ).toHaveBeenCalledWith(usernameElement);
      expect(usernameElement.getBoundingClientRect).toHaveBeenCalled();
      expect(domElementVisibilityService["isElementOutsideViewportBounds"]).toHaveBeenCalledWith(
        usernameElement,
        usernameElement.getBoundingClientRect()
      );
      expect(domElementVisibilityService["isElementHiddenByCss"]).not.toHaveBeenCalled();
      expect(
        domElementVisibilityService["formFieldIsNotHiddenBehindAnotherElement"]
      ).not.toHaveBeenCalled();
    });

    it("returns false if the element is hidden by CSS", async function () {
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;
      const mockIntersectionObserverEntry = createIntersectObserverEntryMock({
        target: usernameElement,
      });
      jest
        .spyOn(domElementVisibilityService as any, "getElementIntersectionObserverEntry")
        .mockResolvedValueOnce(mockIntersectionObserverEntry);
      jest.spyOn(usernameElement, "getBoundingClientRect");
      jest
        .spyOn(domElementVisibilityService as any, "isElementOutsideViewportBounds")
        .mockReturnValueOnce(false);
      jest.spyOn(domElementVisibilityService, "isElementHiddenByCss").mockReturnValueOnce(true);
      jest.spyOn(domElementVisibilityService as any, "formFieldIsNotHiddenBehindAnotherElement");

      const isFormFieldViewable = await domElementVisibilityService.isFormFieldViewable(
        usernameElement
      );

      expect(isFormFieldViewable).toEqual(false);
      expect(
        domElementVisibilityService["getElementIntersectionObserverEntry"]
      ).toHaveBeenCalledWith(usernameElement);
      expect(usernameElement.getBoundingClientRect).not.toHaveBeenCalled();
      expect(domElementVisibilityService["isElementOutsideViewportBounds"]).toHaveBeenCalledWith(
        usernameElement,
        mockIntersectionObserverEntry.boundingClientRect
      );
      expect(domElementVisibilityService["isElementHiddenByCss"]).toHaveBeenCalledWith(
        usernameElement
      );
      expect(
        domElementVisibilityService["formFieldIsNotHiddenBehindAnotherElement"]
      ).not.toHaveBeenCalled();
    });

    it("returns false if the element is hidden behind another element", async function () {
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;
      const mockIntersectionObserverEntry = createIntersectObserverEntryMock({
        target: usernameElement,
      });
      jest
        .spyOn(domElementVisibilityService as any, "getElementIntersectionObserverEntry")
        .mockResolvedValueOnce(mockIntersectionObserverEntry);
      jest.spyOn(usernameElement, "getBoundingClientRect");
      jest
        .spyOn(domElementVisibilityService as any, "isElementOutsideViewportBounds")
        .mockReturnValueOnce(false);
      jest.spyOn(domElementVisibilityService, "isElementHiddenByCss").mockReturnValueOnce(false);
      jest
        .spyOn(domElementVisibilityService as any, "formFieldIsNotHiddenBehindAnotherElement")
        .mockReturnValueOnce(false);

      const isFormFieldViewable = await domElementVisibilityService.isFormFieldViewable(
        usernameElement
      );

      expect(isFormFieldViewable).toEqual(false);
      expect(
        domElementVisibilityService["getElementIntersectionObserverEntry"]
      ).toHaveBeenCalledWith(usernameElement);
      expect(usernameElement.getBoundingClientRect).not.toHaveBeenCalled();
      expect(domElementVisibilityService["isElementOutsideViewportBounds"]).toHaveBeenCalledWith(
        usernameElement,
        mockIntersectionObserverEntry.boundingClientRect
      );
      expect(domElementVisibilityService["isElementHiddenByCss"]).toHaveBeenCalledWith(
        usernameElement
      );
      expect(
        domElementVisibilityService["formFieldIsNotHiddenBehindAnotherElement"]
      ).toHaveBeenCalledWith(usernameElement, mockIntersectionObserverEntry.boundingClientRect);
    });

    it("returns true if the form field is viewable", async function () {
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;
      const mockIntersectionObserverEntry = createIntersectObserverEntryMock({
        target: usernameElement,
      });
      jest
        .spyOn(domElementVisibilityService as any, "getElementIntersectionObserverEntry")
        .mockResolvedValueOnce(mockIntersectionObserverEntry);
      jest.spyOn(usernameElement, "getBoundingClientRect");
      jest
        .spyOn(domElementVisibilityService as any, "isElementOutsideViewportBounds")
        .mockReturnValueOnce(false);
      jest.spyOn(domElementVisibilityService, "isElementHiddenByCss").mockReturnValueOnce(false);
      jest
        .spyOn(domElementVisibilityService as any, "formFieldIsNotHiddenBehindAnotherElement")
        .mockReturnValueOnce(true);

      const isFormFieldViewable = await domElementVisibilityService.isFormFieldViewable(
        usernameElement
      );

      expect(isFormFieldViewable).toEqual(true);
      expect(
        domElementVisibilityService["getElementIntersectionObserverEntry"]
      ).toHaveBeenCalledWith(usernameElement);
      expect(usernameElement.getBoundingClientRect).not.toHaveBeenCalled();
      expect(domElementVisibilityService["isElementOutsideViewportBounds"]).toHaveBeenCalledWith(
        usernameElement,
        mockIntersectionObserverEntry.boundingClientRect
      );
      expect(domElementVisibilityService["isElementHiddenByCss"]).toHaveBeenCalledWith(
        usernameElement
      );
      expect(
        domElementVisibilityService["formFieldIsNotHiddenBehindAnotherElement"]
      ).toHaveBeenCalledWith(usernameElement, mockIntersectionObserverEntry.boundingClientRect);
    });
  });

  describe("isElementHiddenByCss", function () {
    it("returns true when a non-hidden element is passed", function () {
      document.body.innerHTML = `
        <input type="text" name="username" id="username" />
      `;
      const usernameElement = document.getElementById("username");

      const isElementHidden = domElementVisibilityService["isElementHiddenByCss"](usernameElement);

      expect(isElementHidden).toEqual(false);
    });

    it("returns true when the element has a `visibility: hidden;` CSS rule applied to it either inline or in a computed style", function () {
      document.body.innerHTML = `
        <input type="text" name="username" id="username" style="visibility: hidden;" />
        <input type="password" name="password" id="password" />
        <style>
          #password {
            visibility: hidden;
          }
        </style>
      `;
      const usernameElement = document.getElementById("username");
      const passwordElement = document.getElementById("password");
      jest.spyOn(usernameElement.style, "getPropertyValue");
      jest.spyOn(usernameElement.ownerDocument.defaultView, "getComputedStyle");
      jest.spyOn(passwordElement.style, "getPropertyValue");
      jest.spyOn(passwordElement.ownerDocument.defaultView, "getComputedStyle");

      const isUsernameElementHidden =
        domElementVisibilityService["isElementHiddenByCss"](usernameElement);
      const isPasswordElementHidden =
        domElementVisibilityService["isElementHiddenByCss"](passwordElement);

      expect(isUsernameElementHidden).toEqual(true);
      expect(usernameElement.style.getPropertyValue).toHaveBeenCalled();
      expect(usernameElement.ownerDocument.defaultView.getComputedStyle).toHaveBeenCalledWith(
        usernameElement
      );
      expect(isPasswordElementHidden).toEqual(true);
      expect(passwordElement.style.getPropertyValue).toHaveBeenCalled();
      expect(passwordElement.ownerDocument.defaultView.getComputedStyle).toHaveBeenCalledWith(
        passwordElement
      );
    });

    it("returns true when the element has a `display: none;` CSS rule applied to it either inline or in a computed style", function () {
      document.body.innerHTML = `
        <input type="text" name="username" id="username" style="display: none;" />
        <input type="password" name="password" id="password" />
        <style>
          #password {
            display: none;
          }
        </style>
      `;
      const usernameElement = document.getElementById("username");
      const passwordElement = document.getElementById("password");

      const isUsernameElementHidden =
        domElementVisibilityService["isElementHiddenByCss"](usernameElement);
      const isPasswordElementHidden =
        domElementVisibilityService["isElementHiddenByCss"](passwordElement);

      expect(isUsernameElementHidden).toEqual(true);
      expect(isPasswordElementHidden).toEqual(true);
    });

    it("returns true when the element has a `opacity: 0;` CSS rule applied to it either inline or in a computed style", function () {
      document.body.innerHTML = `
        <input type="text" name="username" id="username" style="opacity: 0;" />
        <input type="password" name="password" id="password" />
        <style>
          #password {
            opacity: 0;
          }
        </style>
      `;
      const usernameElement = document.getElementById("username");
      const passwordElement = document.getElementById("password");

      const isUsernameElementHidden =
        domElementVisibilityService["isElementHiddenByCss"](usernameElement);
      const isPasswordElementHidden =
        domElementVisibilityService["isElementHiddenByCss"](passwordElement);

      expect(isUsernameElementHidden).toEqual(true);
      expect(isPasswordElementHidden).toEqual(true);
    });

    it("returns true when the element has a `clip-path` CSS rule applied to it that hides the element either inline or in a computed style", function () {
      document.body.innerHTML = `
        <input type="text" name="username" id="username" style="clip-path: inset(50%);" />
        <input type="password" name="password" id="password" />
        <input type="text" >
        <style>
          #password {
            clip-path: inset(100%);
          }
        </style>
      `;
    });
  });

  describe("isElementOutsideViewportBounds", function () {
    const mockViewportWidth = 1920;
    const mockViewportHeight = 1080;

    beforeEach(function () {
      Object.defineProperty(document.documentElement, "scrollWidth", {
        writable: true,
        value: mockViewportWidth,
      });
      Object.defineProperty(document.documentElement, "scrollHeight", {
        writable: true,
        value: mockViewportHeight,
      });
    });

    it("returns true if the passed element's size is not sufficient for visibility", function () {
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;
      const mockIntersectionObserverEntry = createIntersectObserverEntryMock({
        target: usernameElement,
        boundingClientRect: createBoundingClientRectMock({
          width: 9,
          height: 9,
        }),
      });

      const isElementOutsideViewportBounds = domElementVisibilityService[
        "isElementOutsideViewportBounds"
      ](usernameElement, mockIntersectionObserverEntry.boundingClientRect);

      expect(isElementOutsideViewportBounds).toEqual(true);
    });

    it("returns true if the passed element is overflowing the left viewport", function () {
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;
      const mockIntersectionObserverEntry = createIntersectObserverEntryMock({
        target: usernameElement,
        boundingClientRect: createBoundingClientRectMock({
          left: -1,
        }),
      });

      const isElementOutsideViewportBounds = domElementVisibilityService[
        "isElementOutsideViewportBounds"
      ](usernameElement, mockIntersectionObserverEntry.boundingClientRect);

      expect(isElementOutsideViewportBounds).toEqual(true);
    });

    it("returns true if the passed element is overflowing the right viewport", function () {
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;
      const mockIntersectionObserverEntry = createIntersectObserverEntryMock({
        target: usernameElement,
        boundingClientRect: createBoundingClientRectMock({
          left: mockViewportWidth + 1,
        }),
      });

      const isElementOutsideViewportBounds = domElementVisibilityService[
        "isElementOutsideViewportBounds"
      ](usernameElement, mockIntersectionObserverEntry.boundingClientRect);

      expect(isElementOutsideViewportBounds).toEqual(true);
    });

    it("returns true if the passed element is overflowing the top viewport", function () {
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;
      const mockIntersectionObserverEntry = createIntersectObserverEntryMock({
        target: usernameElement,
        boundingClientRect: createBoundingClientRectMock({
          top: -1,
        }),
      });

      const isElementOutsideViewportBounds = domElementVisibilityService[
        "isElementOutsideViewportBounds"
      ](usernameElement, mockIntersectionObserverEntry.boundingClientRect);

      expect(isElementOutsideViewportBounds).toEqual(true);
    });

    it("returns true if the passed element is overflowing the bottom viewport", function () {
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;
      const mockIntersectionObserverEntry = createIntersectObserverEntryMock({
        target: usernameElement,
        boundingClientRect: createBoundingClientRectMock({
          top: mockViewportHeight + 1,
        }),
      });

      const isElementOutsideViewportBounds = domElementVisibilityService[
        "isElementOutsideViewportBounds"
      ](usernameElement, mockIntersectionObserverEntry.boundingClientRect);

      expect(isElementOutsideViewportBounds).toEqual(true);
    });

    it("returns false if the passed element is not outside of the viewport bounds", function () {
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;
      const mockIntersectionObserverEntry = createIntersectObserverEntryMock({
        target: usernameElement,
      });

      const isElementOutsideViewportBounds = domElementVisibilityService[
        "isElementOutsideViewportBounds"
      ](usernameElement, mockIntersectionObserverEntry.boundingClientRect);

      expect(isElementOutsideViewportBounds).toEqual(false);
    });
  });

  describe("formFieldIsNotHiddenBehindAnotherElement", function () {
    it("returns true if the element found at the center point of the passed targetElement is the targetElement itself", function () {
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;
      jest.spyOn(usernameElement, "getBoundingClientRect");
      document.elementFromPoint = jest.fn(() => usernameElement);

      const formFieldIsNotHiddenBehindAnotherElement =
        domElementVisibilityService["formFieldIsNotHiddenBehindAnotherElement"](usernameElement);

      expect(formFieldIsNotHiddenBehindAnotherElement).toEqual(true);
      expect(document.elementFromPoint).toHaveBeenCalled();
      expect(usernameElement.getBoundingClientRect).toHaveBeenCalled();
    });

    it("returns true if the element found at the center point of the passed targetElement is an implicit label of the element", function () {
      document.body.innerHTML = `
        <label>
            <span>Username</span>
            <input type="text" name="username" id="username" />
        </label>
      `;
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;
      const labelTextElement = document.querySelector("span");
      document.elementFromPoint = jest.fn(() => labelTextElement);

      const formFieldIsNotHiddenBehindAnotherElement =
        domElementVisibilityService["formFieldIsNotHiddenBehindAnotherElement"](usernameElement);

      expect(formFieldIsNotHiddenBehindAnotherElement).toEqual(true);
    });

    it("returns true if the element found at the center point of the passed targetElement is a label of the targetElement", function () {
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;
      const labelElement = document.querySelector("label[for='username']") as FormFieldElement;
      const mockBoundingRect = createBoundingClientRectMock({});
      jest.spyOn(usernameElement, "getBoundingClientRect");
      document.elementFromPoint = jest.fn(() => labelElement);

      const formFieldIsNotHiddenBehindAnotherElement = domElementVisibilityService[
        "formFieldIsNotHiddenBehindAnotherElement"
      ](usernameElement, mockBoundingRect);

      expect(formFieldIsNotHiddenBehindAnotherElement).toEqual(true);
      expect(document.elementFromPoint).toHaveBeenCalledWith(
        mockBoundingRect.left + mockBoundingRect.width / 2,
        mockBoundingRect.top + mockBoundingRect.height / 2
      );
      expect(usernameElement.getBoundingClientRect).not.toHaveBeenCalled();
    });

    it("returns false if the element found at the center point is not the passed targetElement or a label of that element", function () {
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;
      document.elementFromPoint = jest.fn(() => document.createElement("div"));

      const formFieldIsNotHiddenBehindAnotherElement =
        domElementVisibilityService["formFieldIsNotHiddenBehindAnotherElement"](usernameElement);

      expect(formFieldIsNotHiddenBehindAnotherElement).toEqual(false);
    });
  });

  describe("getElementIntersectionObserverEntry", function () {
    it("returns null if the IntersectionObserver API is not present within the window", async function () {
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;

      const getElementIntersectionObserverEntry = await domElementVisibilityService[
        "getElementIntersectionObserverEntry"
      ](usernameElement);

      expect(getElementIntersectionObserverEntry).toEqual(null);
    });

    it("returns an promise with IntersectionObserverEntry of the passed element", function () {
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;
      const mockIntersectionObserverEntry = createIntersectObserverEntryMock({
        target: usernameElement,
      });
      window.IntersectionObserver = jest.fn(() => ({
        root: null,
        rootMargin: "0px",
        thresholds: [],
        disconnect: jest.fn(),
        observe: jest.fn().mockResolvedValueOnce(mockIntersectionObserverEntry),
        takeRecords: jest.fn(),
        unobserve: jest.fn(),
      }));
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window.IntersectionObserverEntry = {
        prototype: {
          ...createIntersectObserverEntryMock({}),
        },
      };

      const getElementIntersectionObserverEntryPromise =
        domElementVisibilityService["getElementIntersectionObserverEntry"](usernameElement);

      expect(getElementIntersectionObserverEntryPromise).toBeInstanceOf(Promise);
    });
  });

  describe("handleResolvingIntersectionObserverEntry", function () {
    it("calls the resolve callback with the first found entry and disconnects the observer", function () {
      const usernameElement = document.querySelector("input[name='username']") as FormFieldElement;
      const mockIntersectionObserverEntry = createIntersectObserverEntryMock({
        target: usernameElement,
      });
      window.IntersectionObserver = jest.fn(() => ({
        root: null,
        rootMargin: "0px",
        thresholds: [],
        disconnect: jest.fn(),
        observe: jest.fn(),
        takeRecords: jest.fn(),
        unobserve: jest.fn(),
      }));
      const observer = new IntersectionObserver(jest.fn(), {});
      const resolve = jest.fn();
      jest.spyOn(observer, "disconnect");

      domElementVisibilityService["handleResolvingIntersectionObserverEntry"](resolve, observer, [
        mockIntersectionObserverEntry,
      ]);

      expect(resolve).toHaveBeenCalledWith(mockIntersectionObserverEntry);
      expect(observer.disconnect).toHaveBeenCalled();
    });
  });
});

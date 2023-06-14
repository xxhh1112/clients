import { mock } from "jest-mock-extended";

import { FormFieldElement } from "../types";

import DomElementVisibilityService from "./dom-element-visibility.service";

function createIntersectObserverEntryMock(
  customerProperties: Partial<IntersectionObserverEntry> = {}
): IntersectionObserverEntry {
  return {
    target: mock<HTMLElement>(),
    boundingClientRect: {
      top: 100,
      bottom: 0,
      left: 100,
      right: 0,
      width: 500,
      height: 500,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    },
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
        <input type="text" name="username">
        <label for="password">Password</label>
        <input type="password" name="password">
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
});

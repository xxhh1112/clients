import { FormElementWithAttribute } from "../types";

import CollectAutofillContentService from "./collect-autofill-content.service";
import FormFieldVisibilityService from "./form-field-visibility.service";
import InsertAutofillContentService from "./insert-autofill-content.service";

const mockLoginForm = `
  <div id="root">
    <form>
      <input type="text" id="username" />
      <input type="password" />
    </form>
  </div>
`;

describe("InsertAutofillContentService", function () {
  const formFieldVisibilityService = new FormFieldVisibilityService();
  const collectAutofillContentService = new CollectAutofillContentService(
    formFieldVisibilityService
  );
  let autofillInsert: InsertAutofillContentService;

  beforeEach(() => {
    document.body.innerHTML = mockLoginForm;
    autofillInsert = new InsertAutofillContentService(
      formFieldVisibilityService,
      collectAutofillContentService
    );
  });

  describe("canElementBeAnimated", function () {
    it("returns true when the element is a non-hidden password field", function () {
      const testElement = document.querySelector(
        'input[type="password"]'
      ) as FormElementWithAttribute;

      const canElementBeAnimated = autofillInsert["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(true);
    });

    it("returns true when the element is a non-hidden email input", function () {
      document.body.innerHTML = mockLoginForm + '<input type="email" />';
      const testElement = document.querySelector('input[type="email"]') as FormElementWithAttribute;

      const canElementBeAnimated = autofillInsert["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(true);
    });

    it("returns true when the element is a non-hidden text input", function () {
      document.body.innerHTML = mockLoginForm + '<input type="text" />';
      const testElement = document.querySelector('input[type="text"]') as FormElementWithAttribute;

      const canElementBeAnimated = autofillInsert["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(true);
    });

    it("returns true when the element is a non-hidden number input", function () {
      document.body.innerHTML = mockLoginForm + '<input type="number" />';
      const testElement = document.querySelector(
        'input[type="number"]'
      ) as FormElementWithAttribute;

      const canElementBeAnimated = autofillInsert["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(true);
    });

    it("returns true when the element is a non-hidden tel input", function () {
      document.body.innerHTML = mockLoginForm + '<input type="tel" />';
      const testElement = document.querySelector('input[type="tel"]') as FormElementWithAttribute;

      const canElementBeAnimated = autofillInsert["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(true);
    });

    it("returns true when the element is a non-hidden url input", function () {
      document.body.innerHTML = mockLoginForm + '<input type="url" />';
      const testElement = document.querySelector('input[type="url"]') as FormElementWithAttribute;

      const canElementBeAnimated = autofillInsert["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(true);
    });

    it("returns true when the element is a non-hidden span", function () {
      document.body.innerHTML = mockLoginForm + '<span id="input-tag"></span>';
      const testElement = document.querySelector("#input-tag") as FormElementWithAttribute;

      const canElementBeAnimated = autofillInsert["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(true);
    });

    it("returns false when the element is a non-hidden hidden input type", function () {
      document.body.innerHTML = mockLoginForm + '<input type="hidden" />';
      const testElement = document.querySelector(
        'input[type="hidden"]'
      ) as FormElementWithAttribute;

      const canElementBeAnimated = autofillInsert["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(false);
    });

    it("returns false when the element is a non-hidden textarea", function () {
      document.body.innerHTML = mockLoginForm + "<textarea></textarea>";
      const testElement = document.querySelector("textarea") as FormElementWithAttribute;

      const canElementBeAnimated = autofillInsert["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(false);
    });

    it("return false when the element is a unsupported tag", function () {
      document.body.innerHTML = mockLoginForm + '<div id="input-tag"></div>';
      const testElement = document.querySelector("#input-tag") as FormElementWithAttribute;

      const canElementBeAnimated = autofillInsert["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(false);
    });

    it("returns false when the element has a `visibility: hidden;` CSS rule applied to it", function () {
      const testElement = document.querySelector(
        'input[type="password"]'
      ) as FormElementWithAttribute;
      testElement.style.visibility = "hidden";

      const canElementBeAnimated = autofillInsert["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(false);
    });

    it("returns false when the element has a `display: none;` CSS rule applied to it", function () {
      const testElement = document.querySelector(
        'input[type="password"]'
      ) as FormElementWithAttribute;
      testElement.style.display = "none";

      const canElementBeAnimated = autofillInsert["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(false);
    });

    it("returns false when a parent of the element has an `opacity: 0;` CSS rule applied to it", function () {
      document.body.innerHTML =
        mockLoginForm + '<div style="opacity: 0;"><input type="email" /></div>';
      const testElement = document.querySelector('input[type="email"]') as FormElementWithAttribute;

      const canElementBeAnimated = autofillInsert["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(false);
    });
  });
});

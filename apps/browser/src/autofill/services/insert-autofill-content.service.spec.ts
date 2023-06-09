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

let confirmSpy: jest.SpyInstance<boolean, [message?: string]>;
let windowSpy: jest.SpyInstance<any>;
let savedURLs: string[] | null = ["https://bitwarden.com"];
function setMockWindowLocationProtocol(protocol: "http:" | "https:") {
  windowSpy.mockImplementation(() => ({
    location: {
      protocol,
    },
  }));
}

describe("InsertAutofillContentService", function () {
  const formFieldVisibilityService = new FormFieldVisibilityService();
  const collectAutofillContentService = new CollectAutofillContentService(
    formFieldVisibilityService
  );
  let insertAutofillContentService: InsertAutofillContentService;

  beforeEach(() => {
    document.body.innerHTML = mockLoginForm;
    insertAutofillContentService = new InsertAutofillContentService(
      formFieldVisibilityService,
      collectAutofillContentService
    );
  });

  afterEach(() => {
    windowSpy.mockRestore();
    confirmSpy.mockRestore();
  });

  describe("userCancelledInsecureUrlAutofill", function () {
    beforeEach(() => {
      savedURLs = ["https://bitwarden.com"];
      confirmSpy = jest.spyOn(window, "confirm");
      windowSpy = jest.spyOn(window, "window", "get");
    });

    it("returns false if on page with no password field", function () {
      setMockWindowLocationProtocol("https:");

      document.body.innerHTML = `
        <div id="root">
          <form>
            <input type="text" id="username" />
          </form>
        </div>
      `;

      const userCancelledInsecureUrlAutofill =
        insertAutofillContentService["userCancelledInsecureUrlAutofill"](savedURLs);

      expect(userCancelledInsecureUrlAutofill).toBe(false);
    });

    it("returns false if Autofill occurring on https page with saved https URL", function () {
      setMockWindowLocationProtocol("https:");

      const userCancelledInsecureUrlAutofill =
        insertAutofillContentService["userCancelledInsecureUrlAutofill"](savedURLs);

      expect(userCancelledInsecureUrlAutofill).toBe(false);
    });

    it("returns false if Autofill occurring on http page with saved https URL and user approval", function () {
      setMockWindowLocationProtocol("http:");
      confirmSpy.mockImplementation(jest.fn(() => true));

      const userCancelledInsecureUrlAutofill =
        insertAutofillContentService["userCancelledInsecureUrlAutofill"](savedURLs);

      expect(userCancelledInsecureUrlAutofill).toBe(false);
    });

    it("returns false if Autofill occurring on http page with saved http URL", function () {
      savedURLs = ["http://bitwarden.com"];
      setMockWindowLocationProtocol("http:");

      const userCancelledInsecureUrlAutofill =
        insertAutofillContentService["userCancelledInsecureUrlAutofill"](savedURLs);

      expect(userCancelledInsecureUrlAutofill).toBe(false);
    });

    it("returns false if Autofill occurring when there are no saved URLs", function () {
      savedURLs = [];
      setMockWindowLocationProtocol("http:");

      const userCancelledInsecureUrlAutofill =
        insertAutofillContentService["userCancelledInsecureUrlAutofill"](savedURLs);

      expect(userCancelledInsecureUrlAutofill).toBe(false);

      savedURLs = null;

      const userCancelledInsecureUrlAutofill2 =
        insertAutofillContentService["userCancelledInsecureUrlAutofill"](savedURLs);

      expect(userCancelledInsecureUrlAutofill2).toBe(false);
    });

    it("returns true if Autofill occurring on http page with saved https URL and user disapproval", function () {
      setMockWindowLocationProtocol("http:");
      confirmSpy.mockImplementation(jest.fn(() => false));

      const userCancelledInsecureUrlAutofill =
        insertAutofillContentService["userCancelledInsecureUrlAutofill"](savedURLs);

      expect(userCancelledInsecureUrlAutofill).toBe(true);
    });
  });

  describe("canElementBeAnimated", function () {
    it("returns true when the element is a non-hidden password field", function () {
      const testElement = document.querySelector(
        'input[type="password"]'
      ) as FormElementWithAttribute;

      const canElementBeAnimated =
        insertAutofillContentService["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(true);
    });

    it("returns true when the element is a non-hidden email input", function () {
      document.body.innerHTML = mockLoginForm + '<input type="email" />';
      const testElement = document.querySelector('input[type="email"]') as FormElementWithAttribute;

      const canElementBeAnimated =
        insertAutofillContentService["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(true);
    });

    it("returns true when the element is a non-hidden text input", function () {
      document.body.innerHTML = mockLoginForm + '<input type="text" />';
      const testElement = document.querySelector('input[type="text"]') as FormElementWithAttribute;

      const canElementBeAnimated =
        insertAutofillContentService["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(true);
    });

    it("returns true when the element is a non-hidden number input", function () {
      document.body.innerHTML = mockLoginForm + '<input type="number" />';
      const testElement = document.querySelector(
        'input[type="number"]'
      ) as FormElementWithAttribute;

      const canElementBeAnimated =
        insertAutofillContentService["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(true);
    });

    it("returns true when the element is a non-hidden tel input", function () {
      document.body.innerHTML = mockLoginForm + '<input type="tel" />';
      const testElement = document.querySelector('input[type="tel"]') as FormElementWithAttribute;

      const canElementBeAnimated =
        insertAutofillContentService["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(true);
    });

    it("returns true when the element is a non-hidden url input", function () {
      document.body.innerHTML = mockLoginForm + '<input type="url" />';
      const testElement = document.querySelector('input[type="url"]') as FormElementWithAttribute;

      const canElementBeAnimated =
        insertAutofillContentService["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(true);
    });

    it("returns true when the element is a non-hidden span", function () {
      document.body.innerHTML = mockLoginForm + '<span id="input-tag"></span>';
      const testElement = document.querySelector("#input-tag") as FormElementWithAttribute;

      const canElementBeAnimated =
        insertAutofillContentService["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(true);
    });

    it("returns false when the element is a non-hidden hidden input type", function () {
      document.body.innerHTML = mockLoginForm + '<input type="hidden" />';
      const testElement = document.querySelector(
        'input[type="hidden"]'
      ) as FormElementWithAttribute;

      const canElementBeAnimated =
        insertAutofillContentService["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(false);
    });

    it("returns false when the element is a non-hidden textarea", function () {
      document.body.innerHTML = mockLoginForm + "<textarea></textarea>";
      const testElement = document.querySelector("textarea") as FormElementWithAttribute;

      const canElementBeAnimated =
        insertAutofillContentService["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(false);
    });

    it("return false when the element is a unsupported tag", function () {
      document.body.innerHTML = mockLoginForm + '<div id="input-tag"></div>';
      const testElement = document.querySelector("#input-tag") as FormElementWithAttribute;

      const canElementBeAnimated =
        insertAutofillContentService["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(false);
    });

    it("returns false when the element has a `visibility: hidden;` CSS rule applied to it", function () {
      const testElement = document.querySelector(
        'input[type="password"]'
      ) as FormElementWithAttribute;
      testElement.style.visibility = "hidden";

      const canElementBeAnimated =
        insertAutofillContentService["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(false);
    });

    it("returns false when the element has a `display: none;` CSS rule applied to it", function () {
      const testElement = document.querySelector(
        'input[type="password"]'
      ) as FormElementWithAttribute;
      testElement.style.display = "none";

      const canElementBeAnimated =
        insertAutofillContentService["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(false);
    });

    it("returns false when a parent of the element has an `opacity: 0;` CSS rule applied to it", function () {
      document.body.innerHTML =
        mockLoginForm + '<div style="opacity: 0;"><input type="email" /></div>';
      const testElement = document.querySelector('input[type="email"]') as FormElementWithAttribute;

      const canElementBeAnimated =
        insertAutofillContentService["canElementBeAnimated"](testElement);

      expect(canElementBeAnimated).toBe(false);
    });
  });
});

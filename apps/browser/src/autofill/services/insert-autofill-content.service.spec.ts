import AutofillScript from "../models/autofill-script";
import { FillableControl } from "../types";

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
    confirmSpy = jest.spyOn(window, "confirm");
    windowSpy = jest.spyOn(window, "window", "get");
    insertAutofillContentService = new InsertAutofillContentService(
      formFieldVisibilityService,
      collectAutofillContentService
    );
  });

  afterEach(() => {
    windowSpy.mockRestore();
    confirmSpy.mockRestore();
  });

  describe("fillForm", function () {
    let fillScript: AutofillScript;

    beforeEach(function () {
      fillScript = {
        script: [
          ["click_on_opid", "username"],
          ["focus_by_opid", "username"],
          ["fill_by_opid", "username", "test"],
        ],
        properties: {
          delay_between_operations: 20,
        },
        metadata: {},
        autosubmit: null,
        savedUrls: ["https://bitwarden.com"],
        untrustedIframe: false,
        itemType: "login",
      };
    });

    it("returns early if the passed fill script does not have a script property", function () {
      fillScript.script = [];
      jest.spyOn(insertAutofillContentService as any, "fillingWithinSandBoxedIframe");
      jest.spyOn(insertAutofillContentService as any, "userCancelledInsecureUrlAutofill");
      jest.spyOn(insertAutofillContentService as any, "userCancelledUntrustedIframeAutofill");
      jest.spyOn(insertAutofillContentService as any, "runFillScriptAction");

      insertAutofillContentService.fillForm(fillScript);

      expect(insertAutofillContentService["fillingWithinSandBoxedIframe"]).not.toHaveBeenCalled();
      expect(
        insertAutofillContentService["userCancelledInsecureUrlAutofill"]
      ).not.toHaveBeenCalled();
      expect(
        insertAutofillContentService["userCancelledUntrustedIframeAutofill"]
      ).not.toHaveBeenCalled();
      expect(insertAutofillContentService["runFillScriptAction"]).not.toHaveBeenCalled();
    });

    it("returns early if the script is filling within a sand boxed iframe", function () {
      jest
        .spyOn(insertAutofillContentService as any, "fillingWithinSandBoxedIframe")
        .mockReturnValue(true);
      jest.spyOn(insertAutofillContentService as any, "userCancelledInsecureUrlAutofill");
      jest.spyOn(insertAutofillContentService as any, "userCancelledUntrustedIframeAutofill");
      jest.spyOn(insertAutofillContentService as any, "runFillScriptAction");

      insertAutofillContentService.fillForm(fillScript);

      expect(insertAutofillContentService["fillingWithinSandBoxedIframe"]).toHaveBeenCalled();
      expect(
        insertAutofillContentService["userCancelledInsecureUrlAutofill"]
      ).not.toHaveBeenCalled();
      expect(
        insertAutofillContentService["userCancelledUntrustedIframeAutofill"]
      ).not.toHaveBeenCalled();
      expect(insertAutofillContentService["runFillScriptAction"]).not.toHaveBeenCalled();
    });

    it("returns early if the autofill is occurring on an insecure url and the user cancels the autofill", function () {
      jest
        .spyOn(insertAutofillContentService as any, "fillingWithinSandBoxedIframe")
        .mockReturnValue(false);
      jest
        .spyOn(insertAutofillContentService as any, "userCancelledInsecureUrlAutofill")
        .mockReturnValue(true);
      jest.spyOn(insertAutofillContentService as any, "userCancelledUntrustedIframeAutofill");
      jest.spyOn(insertAutofillContentService as any, "runFillScriptAction");

      insertAutofillContentService.fillForm(fillScript);

      expect(insertAutofillContentService["fillingWithinSandBoxedIframe"]).toHaveBeenCalled();
      expect(insertAutofillContentService["userCancelledInsecureUrlAutofill"]).toHaveBeenCalled();
      expect(
        insertAutofillContentService["userCancelledUntrustedIframeAutofill"]
      ).not.toHaveBeenCalled();
      expect(insertAutofillContentService["runFillScriptAction"]).not.toHaveBeenCalled();
    });

    it("returns early if the iframe is untrusted and the user cancelled the autofill", function () {
      jest
        .spyOn(insertAutofillContentService as any, "fillingWithinSandBoxedIframe")
        .mockReturnValue(false);
      jest
        .spyOn(insertAutofillContentService as any, "userCancelledInsecureUrlAutofill")
        .mockReturnValue(false);
      jest
        .spyOn(insertAutofillContentService as any, "userCancelledUntrustedIframeAutofill")
        .mockReturnValue(true);
      jest.spyOn(insertAutofillContentService as any, "runFillScriptAction");

      insertAutofillContentService.fillForm(fillScript);

      expect(insertAutofillContentService["fillingWithinSandBoxedIframe"]).toHaveBeenCalled();
      expect(insertAutofillContentService["userCancelledInsecureUrlAutofill"]).toHaveBeenCalled();
      expect(
        insertAutofillContentService["userCancelledUntrustedIframeAutofill"]
      ).toHaveBeenCalled();
      expect(insertAutofillContentService["runFillScriptAction"]).not.toHaveBeenCalled();
    });

    it("runs the fill script action for all scripts found within the fill script", function () {
      jest
        .spyOn(insertAutofillContentService as any, "fillingWithinSandBoxedIframe")
        .mockReturnValue(false);
      jest
        .spyOn(insertAutofillContentService as any, "userCancelledInsecureUrlAutofill")
        .mockReturnValue(false);
      jest
        .spyOn(insertAutofillContentService as any, "userCancelledUntrustedIframeAutofill")
        .mockReturnValue(false);
      jest.spyOn(insertAutofillContentService as any, "runFillScriptAction");

      insertAutofillContentService.fillForm(fillScript);

      expect(insertAutofillContentService["fillingWithinSandBoxedIframe"]).toHaveBeenCalled();
      expect(insertAutofillContentService["userCancelledInsecureUrlAutofill"]).toHaveBeenCalled();
      expect(
        insertAutofillContentService["userCancelledUntrustedIframeAutofill"]
      ).toHaveBeenCalled();
      expect(insertAutofillContentService["runFillScriptAction"]).toHaveBeenCalledTimes(3);
      expect(insertAutofillContentService["runFillScriptAction"]).toHaveBeenNthCalledWith(
        1,
        fillScript.script[0],
        0,
        fillScript.script
      );
      expect(insertAutofillContentService["runFillScriptAction"]).toHaveBeenNthCalledWith(
        2,
        fillScript.script[1],
        1,
        fillScript.script
      );
      expect(insertAutofillContentService["runFillScriptAction"]).toHaveBeenNthCalledWith(
        3,
        fillScript.script[2],
        2,
        fillScript.script
      );
    });
  });

  describe("userCancelledInsecureUrlAutofill", function () {
    beforeEach(() => {
      savedURLs = ["https://bitwarden.com"];
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

  describe("triggerFillAnimationOnElement", function () {
    beforeEach(function () {
      jest.useFakeTimers();
      jest.clearAllTimers();
    });

    it("will not trigger the animation when the element is a non-hidden hidden input type", async function () {
      document.body.innerHTML = mockLoginForm + '<input type="hidden" />';
      const testElement = document.querySelector('input[type="hidden"]') as FillableControl;
      jest.spyOn(testElement.classList, "add");
      jest.spyOn(testElement.classList, "remove");

      insertAutofillContentService["triggerFillAnimationOnElement"](testElement);
      await jest.advanceTimersByTime(200);

      expect(testElement.classList.add).not.toHaveBeenCalled();
      expect(testElement.classList.remove).not.toHaveBeenCalled();
    });

    it("will not trigger the animation when the element is a non-hidden textarea", function () {
      document.body.innerHTML = mockLoginForm + "<textarea></textarea>";
      const testElement = document.querySelector("textarea") as FillableControl;
      jest.spyOn(testElement.classList, "add");
      jest.spyOn(testElement.classList, "remove");

      insertAutofillContentService["triggerFillAnimationOnElement"](testElement);
      jest.advanceTimersByTime(200);

      expect(testElement.classList.add).not.toHaveBeenCalled();
      expect(testElement.classList.remove).not.toHaveBeenCalled();
    });

    it("will not trigger the animation when the element is a unsupported tag", function () {
      document.body.innerHTML = mockLoginForm + '<div id="input-tag"></div>';
      const testElement = document.querySelector("#input-tag") as FillableControl;
      jest.spyOn(testElement.classList, "add");
      jest.spyOn(testElement.classList, "remove");

      insertAutofillContentService["triggerFillAnimationOnElement"](testElement);
      jest.advanceTimersByTime(200);

      expect(testElement.classList.add).not.toHaveBeenCalled();
      expect(testElement.classList.remove).not.toHaveBeenCalled();
    });

    it("will not trigger the animation when the element has a `visibility: hidden;` CSS rule applied to it", function () {
      const testElement = document.querySelector('input[type="password"]') as FillableControl;
      testElement.style.visibility = "hidden";
      jest.spyOn(testElement.classList, "add");
      jest.spyOn(testElement.classList, "remove");

      insertAutofillContentService["triggerFillAnimationOnElement"](testElement);
      jest.advanceTimersByTime(200);

      expect(testElement.classList.add).not.toHaveBeenCalled();
      expect(testElement.classList.remove).not.toHaveBeenCalled();
    });

    it("will not trigger the animation when the element has a `display: none;` CSS rule applied to it", function () {
      const testElement = document.querySelector('input[type="password"]') as FillableControl;
      testElement.style.display = "none";
      jest.spyOn(testElement.classList, "add");
      jest.spyOn(testElement.classList, "remove");

      insertAutofillContentService["triggerFillAnimationOnElement"](testElement);
      jest.advanceTimersByTime(200);

      expect(testElement.classList.add).not.toHaveBeenCalled();
      expect(testElement.classList.remove).not.toHaveBeenCalled();
    });

    it("will not trigger the animation when a parent of the element has an `opacity: 0;` CSS rule applied to it", function () {
      document.body.innerHTML =
        mockLoginForm + '<div style="opacity: 0;"><input type="email" /></div>';
      const testElement = document.querySelector('input[type="email"]') as FillableControl;
      jest.spyOn(testElement.classList, "add");
      jest.spyOn(testElement.classList, "remove");

      insertAutofillContentService["triggerFillAnimationOnElement"](testElement);
      jest.advanceTimersByTime(200);

      expect(testElement.classList.add).not.toHaveBeenCalled();
      expect(testElement.classList.remove).not.toHaveBeenCalled();
    });

    it("will trigger the animation when the element is a non-hidden password field", function () {
      const testElement = document.querySelector('input[type="password"]') as FillableControl;
      jest.spyOn(insertAutofillContentService["formFieldVisibilityService"], "isFieldHiddenByCss");
      jest.spyOn(testElement.classList, "add");
      jest.spyOn(testElement.classList, "remove");

      insertAutofillContentService["triggerFillAnimationOnElement"](testElement);
      jest.advanceTimersByTime(200);

      expect(
        insertAutofillContentService["formFieldVisibilityService"].isFieldHiddenByCss
      ).toHaveBeenCalledWith(testElement);
      expect(testElement.classList.add).toHaveBeenCalledWith("com-bitwarden-browser-animated-fill");
      expect(testElement.classList.remove).toHaveBeenCalledWith(
        "com-bitwarden-browser-animated-fill"
      );
    });

    it("will trigger the animation when the element is a non-hidden email input", function () {
      document.body.innerHTML = mockLoginForm + '<input type="email" />';
      const testElement = document.querySelector('input[type="email"]') as FillableControl;
      jest.spyOn(testElement.classList, "add");
      jest.spyOn(testElement.classList, "remove");

      insertAutofillContentService["triggerFillAnimationOnElement"](testElement);
      jest.advanceTimersByTime(200);

      expect(testElement.classList.add).toHaveBeenCalledWith("com-bitwarden-browser-animated-fill");
      expect(testElement.classList.remove).toHaveBeenCalledWith(
        "com-bitwarden-browser-animated-fill"
      );
    });

    it("will trigger the animation when the element is a non-hidden text input", function () {
      document.body.innerHTML = mockLoginForm + '<input type="text" />';
      const testElement = document.querySelector('input[type="text"]') as FillableControl;
      jest.spyOn(testElement.classList, "add");
      jest.spyOn(testElement.classList, "remove");

      insertAutofillContentService["triggerFillAnimationOnElement"](testElement);
      jest.advanceTimersByTime(200);

      expect(testElement.classList.add).toHaveBeenCalledWith("com-bitwarden-browser-animated-fill");
      expect(testElement.classList.remove).toHaveBeenCalledWith(
        "com-bitwarden-browser-animated-fill"
      );
    });

    it("will trigger the animation when the element is a non-hidden number input", function () {
      document.body.innerHTML = mockLoginForm + '<input type="number" />';
      const testElement = document.querySelector('input[type="number"]') as FillableControl;
      jest.spyOn(testElement.classList, "add");
      jest.spyOn(testElement.classList, "remove");

      insertAutofillContentService["triggerFillAnimationOnElement"](testElement);
      jest.advanceTimersByTime(200);

      expect(testElement.classList.add).toHaveBeenCalledWith("com-bitwarden-browser-animated-fill");
      expect(testElement.classList.remove).toHaveBeenCalledWith(
        "com-bitwarden-browser-animated-fill"
      );
    });

    it("will trigger the animation when the element is a non-hidden tel input", function () {
      document.body.innerHTML = mockLoginForm + '<input type="tel" />';
      const testElement = document.querySelector('input[type="tel"]') as FillableControl;
      jest.spyOn(testElement.classList, "add");
      jest.spyOn(testElement.classList, "remove");

      insertAutofillContentService["triggerFillAnimationOnElement"](testElement);
      jest.advanceTimersByTime(200);

      expect(testElement.classList.add).toHaveBeenCalledWith("com-bitwarden-browser-animated-fill");
      expect(testElement.classList.remove).toHaveBeenCalledWith(
        "com-bitwarden-browser-animated-fill"
      );
    });

    it("will trigger the animation when the element is a non-hidden url input", function () {
      document.body.innerHTML = mockLoginForm + '<input type="url" />';
      const testElement = document.querySelector('input[type="url"]') as FillableControl;
      jest.spyOn(testElement.classList, "add");
      jest.spyOn(testElement.classList, "remove");

      insertAutofillContentService["triggerFillAnimationOnElement"](testElement);
      jest.advanceTimersByTime(200);

      expect(testElement.classList.add).toHaveBeenCalledWith("com-bitwarden-browser-animated-fill");
      expect(testElement.classList.remove).toHaveBeenCalledWith(
        "com-bitwarden-browser-animated-fill"
      );
    });

    it("will trigger the animation when the element is a non-hidden span", function () {
      document.body.innerHTML = mockLoginForm + '<span id="input-tag"></span>';
      const testElement = document.querySelector("#input-tag") as FillableControl;
      jest.spyOn(testElement.classList, "add");
      jest.spyOn(testElement.classList, "remove");

      insertAutofillContentService["triggerFillAnimationOnElement"](testElement);
      jest.advanceTimersByTime(200);

      expect(testElement.classList.add).toHaveBeenCalledWith("com-bitwarden-browser-animated-fill");
      expect(testElement.classList.remove).toHaveBeenCalledWith(
        "com-bitwarden-browser-animated-fill"
      );
    });
  });
});
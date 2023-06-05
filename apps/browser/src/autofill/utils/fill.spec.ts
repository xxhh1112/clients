import { EVENTS } from "../constants";
import { FillableControl, FormElementWithAttribute } from "../types";

import {
  addProperty,
  doClickByOpId,
  // doClickByQuery,
  doFocusByOpId,
  // doSimpleSetByQuery,
  setValueForElement,
  setValueForElementByEvent,
  // touchAllPasswordFields,
  urlNotSecure,
} from "./fill";

const mockLoginForm = `
  <div id="root">
    <form>
      <input type="text" id="username" />
      <input type="password" />
    </form>
  </div>
`;

const eventsToTest = [
  EVENTS.CHANGE,
  EVENTS.INPUT,
  EVENTS.KEYDOWN,
  EVENTS.KEYPRESS,
  EVENTS.KEYUP,
  "blur",
  "click",
  "focus",
  "focusin",
  "focusout",
  "mousedown",
  "paste",
  "select",
  "selectionchange",
  "touchend",
  "touchstart",
];

const initEventCount = Object.freeze(
  eventsToTest.reduce(
    (eventCounts, eventName) => ({
      ...eventCounts,
      [eventName]: 0,
    }),
    {}
  )
);

let confirmSpy: jest.SpyInstance<boolean, [message?: string]>;
let windowSpy: jest.SpyInstance<any>;
let savedURLs: string[] | null = ["https://bitwarden.com"];
document.body.innerHTML = mockLoginForm;

function setMockWindowLocationProtocol(protocol: "http:" | "https:") {
  windowSpy.mockImplementation(() => ({
    location: {
      protocol,
    },
  }));
}

describe("fill utils", () => {
  afterEach(() => {
    document.body.innerHTML = mockLoginForm;
  });

  describe("urlNotSecure", () => {
    beforeEach(() => {
      confirmSpy = jest.spyOn(window, "confirm");
      windowSpy = jest.spyOn(window, "window", "get");
    });

    afterEach(() => {
      windowSpy.mockRestore();
      confirmSpy.mockRestore();
    });

    it("is secure on page with no password field", () => {
      setMockWindowLocationProtocol("https:");

      document.body.innerHTML = `
        <div id="root">
          <form>
            <input type="text" id="username" />
          </form>
        </div>
      `;

      const isNotSecure = urlNotSecure(savedURLs);

      expect(isNotSecure).toEqual(false);
    });

    it("is secure on https page with saved https URL", () => {
      setMockWindowLocationProtocol("https:");

      const isNotSecure = urlNotSecure(savedURLs);

      expect(isNotSecure).toEqual(false);
    });

    it("is secure on http page with saved https URL and user approval", () => {
      confirmSpy.mockImplementation(jest.fn(() => true));

      const isNotSecure = urlNotSecure(savedURLs);

      expect(isNotSecure).toEqual(false);
    });

    it("is not secure on http page with saved https URL and user disapproval", () => {
      setMockWindowLocationProtocol("http:");

      confirmSpy.mockImplementation(jest.fn(() => false));

      const isNotSecure = urlNotSecure(savedURLs);

      expect(isNotSecure).toEqual(true);
    });

    it("is secure on http page with saved http URL", () => {
      savedURLs = ["http://bitwarden.com"];

      setMockWindowLocationProtocol("http:");

      const isNotSecure = urlNotSecure(savedURLs);

      expect(isNotSecure).toEqual(false);
    });

    it("is secure when there are no saved URLs", () => {
      savedURLs = [];

      setMockWindowLocationProtocol("http:");

      let isNotSecure = urlNotSecure(savedURLs);

      expect(isNotSecure).toEqual(false);

      savedURLs = null;

      isNotSecure = urlNotSecure(savedURLs);

      expect(isNotSecure).toEqual(false);
    });
  });

  describe("setValueForElementByEvent", () => {
    it("should fire expected interaction events for the element without changing the value", () => {
      document.body.innerHTML = `
        <input
          name="user_id"
          value="anInitialValue"
        />
      `;

      const targetInput = document.querySelector('[name="user_id"]') as FillableControl;
      const elementEventCount: { [key: string]: number } = {
        ...initEventCount,
      };

      // Testing all the relevant events to ensure downstream side-effects are firing correctly
      const expectedElementEventCount: { [key: string]: number } = {
        ...initEventCount,
        [EVENTS.CHANGE]: 1,
        [EVENTS.INPUT]: 1,
        [EVENTS.KEYDOWN]: 1,
        [EVENTS.KEYPRESS]: 1,
        [EVENTS.KEYUP]: 1,
      };
      const eventHandlers: { [key: string]: EventListener } = {};

      eventsToTest.forEach((eventType) => {
        eventHandlers[eventType] = (handledEvent) => {
          const eventTarget = handledEvent.target as HTMLInputElement;

          if (eventTarget.name === "user_id") {
            // Test value updates as side-effects from events
            eventTarget.value = "valueToOverwrite";
            elementEventCount[handledEvent.type]++;
          }
        };

        targetInput.addEventListener(eventType, eventHandlers[eventType]);
      });

      setValueForElementByEvent(targetInput);

      expect(targetInput.value).toEqual("anInitialValue");
      expect(elementEventCount).toEqual(expectedElementEventCount);

      eventsToTest.forEach((eventType) => {
        targetInput.removeEventListener(eventType, eventHandlers[eventType]);
      });
    });
  });

  describe("setValueForElement", () => {
    it("should fire expected interaction events for the element without changing the value", () => {
      document.body.innerHTML = `
        <input
          name="user_id"
          value="anInitialValue"
        />
      `;

      const targetInput = document.querySelector('[name="user_id"]') as FillableControl;
      const elementEventCount: { [key: string]: number } = {
        ...initEventCount,
      };

      // Testing all the relevant events to ensure downstream side-effects are firing correctly
      const expectedElementEventCount: { [key: string]: number } = {
        ...initEventCount,
        [EVENTS.KEYDOWN]: 1,
        [EVENTS.KEYPRESS]: 1,
        [EVENTS.KEYUP]: 1,
        click: 1,
        focus: 1,
        focusin: 1,
      };
      const eventHandlers: { [key: string]: EventListener } = {};

      eventsToTest.forEach((eventType) => {
        eventHandlers[eventType] = (handledEvent) => {
          const eventTarget = handledEvent.target as HTMLInputElement;

          if (eventTarget.name === "user_id") {
            // Test value updates as side-effects from events
            eventTarget.value = "valueToOverwrite";
            elementEventCount[handledEvent.type]++;
          }
        };

        targetInput.addEventListener(eventType, eventHandlers[eventType]);
      });

      setValueForElement(targetInput);

      expect(targetInput.value).toEqual("anInitialValue");
      expect(elementEventCount).toEqual(expectedElementEventCount);

      eventsToTest.forEach((eventType) => {
        targetInput.removeEventListener(eventType, eventHandlers[eventType]);
      });
    });
  });

  /** DEAD CODE */
  // describe("doSimpleSetByQuery", () => {
  //   it("should fill (with the passed value) and return all elements targeted by the passed selector", () => {
  //     document.body.innerHTML =
  //       mockLoginForm + '<input id="input-tag" name="user_id" value="anInitialValue" />';
  //
  //     const targetInputUserId = document.querySelector('[name="user_id"]') as FillableControl;
  //     const targetInputUserName = document.querySelector(
  //       'input[type="text"]#username'
  //     ) as FillableControl;
  //     const passedValue = "jsmith";
  //
  //     expect(targetInputUserId.value).toEqual("anInitialValue");
  //     expect(targetInputUserName.value).toEqual("");
  //     expect(
  //       doSimpleSetByQuery('input[type="text"]#username, [name="user_id"]', passedValue)
  //     ).toHaveLength(2);
  //     expect(targetInputUserId.value).toEqual(passedValue);
  //     expect(targetInputUserName.value).toEqual(passedValue);
  //   });
  //
  //   it("should not fill or return elements targeted by the passed selector which are anchor tags, disabled, read-only, or cannot have a value set", () => {
  //     document.body.innerHTML = `
  //       <input id="input-tag-a" type="text" class="user_id" disabled />
  //       <input id="input-tag-b" type="text" class="user_id" readonly />
  //       <input id="input-tag-c" type="text" class="user_id" />
  //       <a id="input-tag-d" class="user_id" href="./"></a>
  //       <span id="input-tag-e" class="user_id" value="anInitialValue"></span>
  //     `;
  //
  //     const returnedElements = doSimpleSetByQuery(".user_id", "aUsername");
  //
  //     expect(returnedElements).toHaveLength(1);
  //     expect(returnedElements[0].id).toEqual("input-tag-c");
  //     expect(returnedElements[0].value).toEqual("aUsername");
  //   });
  // });
  /** END DEAD CODE */

  describe("doClickByOpId", () => {
    it("should click on and return the elements targeted by the passed opid", () => {
      const textInput = document.querySelector('input[type="text"]') as FormElementWithAttribute;
      textInput.opid = "__1";
      let clickEventCount = 0;
      const expectedClickEventCount = 1;
      const clickEventHandler: (handledEvent: Event) => void = (handledEvent) => {
        const eventTarget = handledEvent.target as HTMLInputElement;

        if (eventTarget.id === "username") {
          clickEventCount++;
        }
      };

      textInput.addEventListener("click", clickEventHandler);

      expect(doClickByOpId("__1")?.[0]).toEqual(textInput);
      expect(clickEventCount).toEqual(expectedClickEventCount);

      textInput.removeEventListener("click", clickEventHandler);
    });

    it("should not click and should return null when no suitable elements can be found", () => {
      const textInput = document.querySelector('input[type="text"]') as FormElementWithAttribute;

      let clickEventCount = 0;
      const expectedClickEventCount = 0;
      const clickEventHandler: (handledEvent: Event) => void = (handledEvent) => {
        const eventTarget = handledEvent.target as HTMLInputElement;

        if (eventTarget.id === "username") {
          clickEventCount++;
        }
      };

      textInput.addEventListener("click", clickEventHandler);

      expect(clickEventCount).toEqual(expectedClickEventCount);
      expect(doClickByOpId("__2")).toEqual(null);

      textInput.removeEventListener("click", clickEventHandler);
    });

    // @TODO better define this code path
    it("should return null when the targeted element is found but not clickable", () => {
      const textInput = document.querySelector('input[type="text"]') as FormElementWithAttribute;
      textInput.opid = "__1";
      textInput.click = null;

      let clickEventCount = 0;
      const expectedClickEventCount = 0;
      const clickEventHandler: (handledEvent: Event) => void = (handledEvent) => {
        const eventTarget = handledEvent.target as HTMLInputElement;

        if (eventTarget.id === "username") {
          clickEventCount++;
        }
      };

      textInput.addEventListener("click", clickEventHandler);

      expect(clickEventCount).toEqual(expectedClickEventCount);
      expect(doClickByOpId("__1")).toEqual(null);

      textInput.removeEventListener("click", clickEventHandler);
    });
  });

  /** DEAD CODE */
  // describe("touchAllPasswordFields", () => {
  //   it("should, for each possible password field in the document, set the existing value and click the element if it is clickable", () => {
  //     document.body.innerHTML += '<input type="text" name="text_password" value="password" />';
  //     const targetInput = document.querySelector(
  //       'input[type="text"][name="text_password"]'
  //     ) as FormElementWithAttribute;
  //     const elementEventCount: { [key: string]: number } = {
  //       ...initEventCount,
  //     };
  //
  //     // Testing all the relevant events to ensure downstream side-effects are firing correctly
  //     const expectedElementEventCount: { [key: string]: number } = {
  //       ...initEventCount,
  //       [EVENTS.CHANGE]: 1,
  //       [EVENTS.INPUT]: 1,
  //       [EVENTS.KEYDOWN]: 2,
  //       [EVENTS.KEYPRESS]: 2,
  //       [EVENTS.KEYUP]: 2,
  //       blur: 1,
  //       click: 2,
  //       focus: 1,
  //       focusin: 1,
  //       focusout: 1,
  //     };
  //     const eventHandlers: { [key: string]: EventListener } = {};
  //
  //     eventsToTest.forEach((eventType) => {
  //       eventHandlers[eventType] = (handledEvent) => {
  //         elementEventCount[handledEvent.type]++;
  //       };
  //
  //       targetInput.addEventListener(eventType, eventHandlers[eventType]);
  //     });
  //
  //     touchAllPasswordFields();
  //
  //     expect(elementEventCount).toEqual(expectedElementEventCount);
  //
  //     eventsToTest.forEach((eventType) => {
  //       targetInput.removeEventListener(eventType, eventHandlers[eventType]);
  //     });
  //   });
  // });
  /** END DEAD CODE */

  /** DEAD CODE */
  // describe("doClickByQuery", () => {
  //   it("should click and focus the elements targeted by the passed selector", () => {
  //     const passedSelector = 'input[type="text"]';
  //     const targetInput = document.querySelector(passedSelector) as FormElementWithAttribute;
  //     const elementEventCount: { [key: string]: number } = {
  //       ...initEventCount,
  //     };
  //
  //     // Testing all the relevant events to ensure downstream side-effects are firing correctly
  //     const expectedElementEventCount: { [key: string]: number } = {
  //       ...initEventCount,
  //       click: 2,
  //       focus: 1,
  //       focusin: 1,
  //     };
  //     const eventHandlers: { [key: string]: EventListener } = {};
  //
  //     eventsToTest.forEach((eventType) => {
  //       eventHandlers[eventType] = (handledEvent) => {
  //         elementEventCount[handledEvent.type]++;
  //       };
  //
  //       targetInput.addEventListener(eventType, eventHandlers[eventType]);
  //     });
  //
  //     expect(doClickByQuery(passedSelector)).toEqual(undefined);
  //
  //     expect(elementEventCount).toEqual(expectedElementEventCount);
  //
  //     eventsToTest.forEach((eventType) => {
  //       targetInput.removeEventListener(eventType, eventHandlers[eventType]);
  //     });
  //   });
  // });
  /** END DEAD CODE */

  describe("doFocusByOpId", () => {
    it("should click and focus the elements targeted by the passed opid", () => {
      const targetInput = document.querySelector('input[type="text"]') as FormElementWithAttribute;
      const elementEventCount: { [key: string]: number } = {
        ...initEventCount,
      };

      // Testing all the relevant events to ensure downstream side-effects are firing correctly
      const expectedElementEventCount: { [key: string]: number } = {
        ...initEventCount,
        click: 1,
        focus: 1,
        focusin: 1,
      };
      const eventHandlers: { [key: string]: EventListener } = {};

      eventsToTest.forEach((eventType) => {
        eventHandlers[eventType] = (handledEvent) => {
          elementEventCount[handledEvent.type]++;
        };

        targetInput.addEventListener(eventType, eventHandlers[eventType]);
      });

      expect(doFocusByOpId("__0")).toEqual(null);

      expect(elementEventCount).toEqual(expectedElementEventCount);

      eventsToTest.forEach((eventType) => {
        targetInput.removeEventListener(eventType, eventHandlers[eventType]);
      });
    });
  });

  describe("addProperty", () => {
    it("should add the passed string value to the passed record as a property", () => {
      const propertyName = "isArbitraryProperty";
      const propertyValue = "probably not";
      const fieldRecord: Record<string, any> = {};

      expect(fieldRecord).not.toHaveProperty(propertyName);

      addProperty(fieldRecord, propertyName, propertyValue);

      expect(fieldRecord).toEqual({ [propertyName]: propertyValue });
    });

    it("should not add the passed string value to the passed record as a property if the passed value is null, undefined, or matches the optional 'do not set' value", () => {
      const propertyName = "isArbitraryProperty";
      const propertyValue = "probably not";
      const fieldRecord: Record<string, any> = {};

      expect(fieldRecord).toEqual({});

      addProperty(fieldRecord, propertyName, propertyValue, propertyValue);

      expect(fieldRecord).toEqual({});

      addProperty(fieldRecord, propertyName, null);

      expect(fieldRecord).toEqual({});

      addProperty(fieldRecord, propertyName, undefined);

      expect(fieldRecord).toEqual({});
    });
  });
});

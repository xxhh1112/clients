import { mock } from "jest-mock-extended";

import AutofillPageDetails from "../models/autofill-page-details";
import AutofillScript from "../models/autofill-script";

import { AutofillExtensionMessage } from "./abstractions/autofill-init";
import AutofillInit from "./autofill-init";

describe("AutofillInit", () => {
  let autofillInit: AutofillInit;

  beforeEach(() => {
    autofillInit = new AutofillInit();
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("init", () => {
    it("sets up the extension message listeners", () => {
      jest.spyOn(autofillInit as any, "setupExtensionMessageListeners");

      autofillInit.init();

      expect(autofillInit["setupExtensionMessageListeners"]).toHaveBeenCalled();
    });
  });

  describe("collectPageDetails", () => {
    let extensionMessage: AutofillExtensionMessage;
    let pageDetails: AutofillPageDetails;

    beforeEach(() => {
      extensionMessage = {
        command: "collectPageDetails",
        tab: mock<chrome.tabs.Tab>(),
        sender: "sender",
      };
      pageDetails = {
        title: "title",
        url: "http://example.com",
        documentUrl: "documentUrl",
        forms: {},
        fields: [],
        collectedTimestamp: 0,
      };
      jest
        .spyOn(autofillInit["collectAutofillContentService"], "getPageDetails")
        .mockResolvedValue(pageDetails);
    });

    it("returns collected page details for autofill if set to send the details in the response", async () => {
      const response = await autofillInit["collectPageDetails"](extensionMessage, true);

      expect(autofillInit["collectAutofillContentService"].getPageDetails).toHaveBeenCalled();
      expect(response).toEqual(pageDetails);
    });

    it("sends the collected page details for autofill using a background script message", async () => {
      jest.spyOn(chrome.runtime, "sendMessage");

      await autofillInit["collectPageDetails"](extensionMessage);

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        command: "collectPageDetailsResponse",
        tab: extensionMessage.tab,
        details: pageDetails,
        sender: extensionMessage.sender,
      });
    });
  });

  describe("fillForm", () => {
    it("will call the InsertAutofillContentService to fill the form", async () => {
      const fillScript = mock<AutofillScript>();
      jest.spyOn(autofillInit["insertAutofillContentService"], "fillForm").mockImplementation();

      await autofillInit["fillForm"](fillScript);

      expect(autofillInit["insertAutofillContentService"].fillForm).toHaveBeenCalledWith(
        fillScript
      );
    });
  });

  describe("setupExtensionMessageListeners", () => {
    it("sets up a chrome runtime on message listener", () => {
      jest.spyOn(chrome.runtime.onMessage, "addListener");

      autofillInit["setupExtensionMessageListeners"]();

      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(
        autofillInit["handleExtensionMessage"]
      );
    });
  });

  describe("handleExtensionMessage", () => {
    let message: AutofillExtensionMessage;
    let sender: chrome.runtime.MessageSender;
    const sendResponse = jest.fn();

    beforeEach(() => {
      message = {
        command: "collectPageDetails",
        tab: mock<chrome.tabs.Tab>(),
        sender: "sender",
      };
      sender = mock<chrome.runtime.MessageSender>();
    });

    it("returns a false value if a extension message handler is not found with the given message command", () => {
      message.command = "unknownCommand";

      const response = autofillInit["handleExtensionMessage"](message, sender, sendResponse);

      expect(response).toBe(false);
    });

    it("returns a false value if the message handler does not return a response", async () => {
      const response1 = await autofillInit["handleExtensionMessage"](message, sender, sendResponse);
      await Promise.resolve(response1);

      expect(response1).not.toBe(false);

      message.command = "addNewVaultItemFromOverlay";
      message.fillScript = mock<AutofillScript>();

      const response2 = await autofillInit["handleExtensionMessage"](message, sender, sendResponse);

      expect(response2).toBe(false);
    });

    it("returns a true value and calls sendResponse if the message handler returns a response", async () => {
      message.command = "collectPageDetailsImmediately";
      const pageDetails: AutofillPageDetails = {
        title: "title",
        url: "http://example.com",
        documentUrl: "documentUrl",
        forms: {},
        fields: [],
        collectedTimestamp: 0,
      };
      jest
        .spyOn(autofillInit["collectAutofillContentService"], "getPageDetails")
        .mockResolvedValue(pageDetails);

      const response = await autofillInit["handleExtensionMessage"](message, sender, sendResponse);
      await Promise.resolve(response);

      expect(response).toBe(true);
      expect(sendResponse).toHaveBeenCalledWith(pageDetails);
    });
  });
});

import { mock } from "jest-mock-extended";

import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import AutofillPageDetails from "../models/autofill-page-details";
import AutofillScript from "../models/autofill-script";
import AutofillOverlayContentService from "../services/autofill-overlay-content.service";
import { RedirectFocusDirection } from "../utils/autofill-overlay.enum";

import { AutofillExtensionMessage } from "./abstractions/autofill-init";
import AutofillInit from "./autofill-init";

describe("AutofillInit", () => {
  let autofillInit: AutofillInit;
  const autofillOverlayContentService = mock<AutofillOverlayContentService>();

  beforeEach(() => {
    autofillInit = new AutofillInit(autofillOverlayContentService);
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

    it("will update the isCurrentlyFilling properties of the overlay and focus the recent field after filling", async () => {
      jest.useFakeTimers();
      const fillScript = mock<AutofillScript>();
      jest.spyOn(autofillInit as any, "updateOverlayIsCurrentlyFilling");
      jest.spyOn(autofillInit["insertAutofillContentService"], "fillForm").mockImplementation();
      jest
        .spyOn(autofillInit["autofillOverlayContentService"], "focusMostRecentOverlayField")
        .mockImplementation();

      await autofillInit["fillForm"](fillScript);
      jest.advanceTimersByTime(300);

      expect(autofillInit["updateOverlayIsCurrentlyFilling"]).toHaveBeenNthCalledWith(1, true);
      expect(autofillInit["insertAutofillContentService"].fillForm).toHaveBeenCalledWith(
        fillScript
      );
      expect(autofillInit["updateOverlayIsCurrentlyFilling"]).toHaveBeenNthCalledWith(2, false);
      expect(
        autofillInit["autofillOverlayContentService"].focusMostRecentOverlayField
      ).toHaveBeenCalled();
    });

    it("will not attempt to focus the most recent field if the autofillOverlayContentService is not present", () => {
      jest.useFakeTimers();
      const newAutofillInit = new AutofillInit(undefined);
      const fillScript = mock<AutofillScript>();
      jest.spyOn(newAutofillInit as any, "updateOverlayIsCurrentlyFilling");
      jest.spyOn(newAutofillInit["insertAutofillContentService"], "fillForm").mockImplementation();

      newAutofillInit["fillForm"](fillScript);
      jest.advanceTimersByTime(300);

      expect(newAutofillInit["updateOverlayIsCurrentlyFilling"]).toHaveBeenNthCalledWith(1, true);
      expect(newAutofillInit["insertAutofillContentService"].fillForm).toHaveBeenCalledWith(
        fillScript
      );
      expect(newAutofillInit["updateOverlayIsCurrentlyFilling"]).not.toHaveBeenNthCalledWith(
        2,
        false
      );
    });
  });

  describe("updateOverlayIsCurrentlyFilling", () => {
    it("will not update the isCurrentlyFilling value if the autofill overlay content service does not exist", () => {
      const newAutofillInit = new AutofillInit(undefined);

      newAutofillInit["updateOverlayIsCurrentlyFilling"](true);

      expect(newAutofillInit["autofillOverlayContentService"]).toBe(undefined);
    });

    it("will update the property that indicates if the overlay is currently filling data", () => {
      autofillInit["autofillOverlayContentService"].isCurrentlyFilling = false;

      autofillInit["updateOverlayIsCurrentlyFilling"](true);

      expect(autofillInit["autofillOverlayContentService"].isCurrentlyFilling).toBe(true);
    });
  });

  describe("openAutofillOverlay", () => {
    it("will not attempt to open the autofill overlay if the autofillOverlayContentService is not present", () => {
      const newAutofillInit = new AutofillInit(undefined);
      const message = {
        command: "openAutofillOverlay",
        data: {
          isFocusingFieldElement: true,
          isOpeningFullOverlay: true,
          authStatus: AuthenticationStatus.Unlocked,
        },
      };

      newAutofillInit["openAutofillOverlay"](message);

      expect(newAutofillInit["autofillOverlayContentService"]).toBe(undefined);
    });

    it("will open the autofill overlay", () => {
      const message = {
        command: "openAutofillOverlay",
        data: {
          isFocusingFieldElement: true,
          isOpeningFullOverlay: true,
          authStatus: AuthenticationStatus.Unlocked,
        },
      };

      autofillInit["openAutofillOverlay"](message);

      expect(
        autofillInit["autofillOverlayContentService"].openAutofillOverlay
      ).toHaveBeenCalledWith(
        message.data.isFocusingFieldElement,
        message.data.isOpeningFullOverlay,
        message.data.authStatus
      );
    });
  });

  describe("blurAndRemoveOverlay", () => {
    it("will not attempt to blur and remove the overlay if the autofillOverlayContentService is not present", () => {
      const newAutofillInit = new AutofillInit(undefined);
      jest.spyOn(newAutofillInit as any, "removeAutofillOverlay");

      newAutofillInit["blurAndRemoveOverlay"]();

      expect(newAutofillInit["autofillOverlayContentService"]).toBe(undefined);
      expect(newAutofillInit["removeAutofillOverlay"]).not.toHaveBeenCalled();
    });

    it("will blur the most recently focused feel and remove the autofill overlay", () => {
      jest.spyOn(autofillInit["autofillOverlayContentService"], "blurMostRecentOverlayField");
      jest.spyOn(autofillInit as any, "removeAutofillOverlay");

      autofillInit["blurAndRemoveOverlay"]();

      expect(
        autofillInit["autofillOverlayContentService"].blurMostRecentOverlayField
      ).toHaveBeenCalled();
      expect(autofillInit["removeAutofillOverlay"]).toHaveBeenCalled();
    });
  });

  describe("removeAutofillOverlay", () => {
    it("will return early if a field is currently focused", () => {
      autofillInit["autofillOverlayContentService"].isFieldCurrentlyFocused = true;

      autofillInit["removeAutofillOverlay"]();

      expect(
        autofillInit["autofillOverlayContentService"].removeAutofillOverlayList
      ).not.toHaveBeenCalled();
      expect(
        autofillInit["autofillOverlayContentService"].removeAutofillOverlay
      ).not.toHaveBeenCalled();
    });

    it("will remove the autofill overlay list if the overlay is currently filling", () => {
      autofillInit["autofillOverlayContentService"].isFieldCurrentlyFocused = false;
      autofillInit["autofillOverlayContentService"].isCurrentlyFilling = true;

      autofillInit["removeAutofillOverlay"]();

      expect(
        autofillInit["autofillOverlayContentService"].removeAutofillOverlayList
      ).toHaveBeenCalled();
      expect(
        autofillInit["autofillOverlayContentService"].removeAutofillOverlay
      ).not.toHaveBeenCalled();
    });

    it("will remove the entire overlay if the overlay is not currently filling", () => {
      autofillInit["autofillOverlayContentService"].isFieldCurrentlyFocused = false;
      autofillInit["autofillOverlayContentService"].isCurrentlyFilling = false;

      autofillInit["removeAutofillOverlay"]();

      expect(
        autofillInit["autofillOverlayContentService"].removeAutofillOverlayList
      ).not.toHaveBeenCalled();
      expect(
        autofillInit["autofillOverlayContentService"].removeAutofillOverlay
      ).toHaveBeenCalled();
    });
  });

  describe("addNewVaultItemFromOverlay", () => {
    it("will not add a new vault item if the autofillOverlayContentService is not present", () => {
      const newAutofillInit = new AutofillInit(undefined);

      newAutofillInit["addNewVaultItemFromOverlay"]();

      expect(newAutofillInit["autofillOverlayContentService"]).toBe(undefined);
    });

    it("will add a new vault item", () => {
      autofillInit["addNewVaultItemFromOverlay"]();

      expect(autofillInit["autofillOverlayContentService"].addNewVaultItem).toHaveBeenCalled();
    });
  });

  describe("redirectOverlayFocusOut", () => {
    it("will not attempt to redirect focus if the autofillOverlayContentService does not exist", () => {
      const newAutofillInit = new AutofillInit(undefined);
      const message = {
        command: "redirectOverlayFocusOut",
        data: {
          direction: RedirectFocusDirection.Next,
        },
      };

      newAutofillInit["redirectOverlayFocusOut"](message);

      expect(newAutofillInit["autofillOverlayContentService"]).toBe(undefined);
    });

    it("will redirect the overlay focus", () => {
      const message = {
        command: "redirectOverlayFocusOut",
        data: {
          direction: RedirectFocusDirection.Next,
        },
      };

      autofillInit["redirectOverlayFocusOut"](message);

      expect(
        autofillInit["autofillOverlayContentService"].redirectOverlayFocusOut
      ).toHaveBeenCalledWith(message.data.direction);
    });
  });

  describe("updateIsOverlayCiphersPopulated", () => {
    it("will not update whether the ciphers are populated if the autofillOverlayContentService does note exist", () => {
      const newAutofillInit = new AutofillInit(undefined);
      const message = {
        command: "updateIsOverlayCiphersPopulated",
        data: {
          isOverlayCiphersPopulated: true,
        },
      };

      newAutofillInit["updateIsOverlayCiphersPopulated"](message);

      expect(newAutofillInit["autofillOverlayContentService"]).toBe(undefined);
    });

    it("will update whether the overlay ciphers are populated", () => {
      const message = {
        command: "updateIsOverlayCiphersPopulated",
        data: {
          isOverlayCiphersPopulated: true,
        },
      };

      autofillInit["updateIsOverlayCiphersPopulated"](message);

      expect(
        autofillInit["autofillOverlayContentService"].setIsOverlayCiphersPopulated
      ).toHaveBeenCalledWith(message.data.isOverlayCiphersPopulated);
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

    it("returns a undefined value if a extension message handler is not found with the given message command", () => {
      message.command = "unknownCommand";

      const response = autofillInit["handleExtensionMessage"](message, sender, sendResponse);

      expect(response).toBe(undefined);
    });

    it("returns a undefined value if the message handler does not return a response", async () => {
      const response1 = await autofillInit["handleExtensionMessage"](message, sender, sendResponse);
      await Promise.resolve(response1);

      expect(response1).not.toBe(false);

      message.command = "addNewVaultItemFromOverlay";
      message.fillScript = mock<AutofillScript>();

      const response2 = await autofillInit["handleExtensionMessage"](message, sender, sendResponse);

      expect(response2).toBe(undefined);
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

import { mock } from "jest-mock-extended";

import { BrowserApi } from "./browser-api";

describe("BrowserApi", function () {
  const executeScriptResult = ["value"];

  beforeEach(function () {
    jest.clearAllMocks();
    chrome.tabs = {
      executeScript: jest.fn((tabId, injectDetails, callback) => callback(executeScriptResult)),
    } as any;
  });

  describe("executeScriptInTab", function () {
    it("calls to the extension api to execute a script within the give tabId", async function () {
      const tabId = 1;
      const injectDetails = mock<chrome.tabs.InjectDetails>();

      const result = await BrowserApi.executeScriptInTab(tabId, injectDetails);

      expect(chrome.tabs.executeScript).toHaveBeenCalledWith(
        tabId,
        injectDetails,
        expect.any(Function)
      );
      expect(result).toEqual(executeScriptResult);
    });
  });
});

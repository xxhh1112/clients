import { mock } from "jest-mock-extended";

import { BrowserApi } from "./browser-api";

describe("BrowserApi", function () {
  const executeScriptResult = ["value"];

  beforeEach(function () {
    jest.clearAllMocks();
    chrome.tabs = {
      executeScript: jest.fn((tabId, injectDetails, callback) => callback(executeScriptResult)),
    } as any;
    chrome.scripting = {
      executeScript: jest.fn().mockResolvedValue(executeScriptResult),
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

    it("calls the manifest v3 scripting API if the extension manifest is for v3", async function () {
      const tabId = 1;
      const injectDetails = mock<chrome.tabs.InjectDetails>({
        file: "file.js",
        allFrames: true,
        runAt: "document_start",
        frameId: null,
      });
      jest.spyOn(BrowserApi, "manifestVersion", "get").mockReturnValue(3);

      const result = await BrowserApi.executeScriptInTab(tabId, injectDetails);

      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: {
          tabId: tabId,
          allFrames: injectDetails.allFrames,
          frameIds: null,
        },
        files: [injectDetails.file],
        injectImmediately: true,
      });
      expect(result).toEqual(executeScriptResult);
    });
  });
});

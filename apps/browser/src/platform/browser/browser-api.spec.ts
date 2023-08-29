import { mock } from "jest-mock-extended";

import { BrowserApi } from "./browser-api";

describe("BrowserApi", () => {
  const executeScriptResult = ["value"];

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("executeScriptInTab", () => {
    it("calls to the extension api to execute a script within the give tabId", async () => {
      const tabId = 1;
      const injectDetails = mock<chrome.tabs.InjectDetails>();
      jest.spyOn(BrowserApi, "manifestVersion", "get").mockReturnValue(2);
      jest
        .spyOn(chrome.tabs, "executeScript")
        .mockImplementation((tabId, injectDetails, callback) => callback(executeScriptResult));

      const result = await BrowserApi.executeScriptInTab(tabId, injectDetails);

      expect(chrome.tabs.executeScript).toHaveBeenCalledWith(
        tabId,
        injectDetails,
        expect.any(Function)
      );
      expect(result).toEqual(executeScriptResult);
    });

    it("calls the manifest v3 scripting API if the extension manifest is for v3", async () => {
      const tabId = 1;
      const injectDetails = mock<chrome.tabs.InjectDetails>({
        file: "file.js",
        allFrames: true,
        runAt: "document_start",
        frameId: null,
      });
      jest.spyOn(BrowserApi, "manifestVersion", "get").mockReturnValue(3);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      jest.spyOn(chrome.scripting, "executeScript").mockResolvedValue(executeScriptResult);

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

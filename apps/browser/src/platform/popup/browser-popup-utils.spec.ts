import { createChromeTabMock } from "../../autofill/jest/autofill-mocks";
import { BrowserApi } from "../browser/browser-api";

import BrowserPopupUtils from "./browser-popup-utils";

describe("BrowserPopupUtils", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("inSidebar", () => {
    it("should return true if the window contains the sidebar query param", () => {
      const win = { location: { search: "?uilocation=sidebar" } } as Window;

      expect(BrowserPopupUtils.inSidebar(win)).toBe(true);
    });

    it("should return false if the window does not contain the sidebar query param", () => {
      const win = { location: { search: "" } } as Window;

      expect(BrowserPopupUtils.inSidebar(win)).toBe(false);
    });
  });

  describe("inPopout", () => {
    it("should return true if the window contains the popout query param", () => {
      const win = { location: { search: "?uilocation=popout" } } as Window;

      expect(BrowserPopupUtils.inPopout(win)).toBe(true);
    });

    it("should return false if the window does not contain the popout query param", () => {
      const win = { location: { search: "" } } as Window;

      expect(BrowserPopupUtils.inPopout(win)).toBe(false);
    });
  });

  describe("inSingleActionPopout", () => {
    it("should return true if the window contains the singleActionPopout query param", () => {
      const win = { location: { search: "?singleActionPopout=123" } } as Window;

      expect(BrowserPopupUtils.inSingleActionPopout(win, "123")).toBe(true);
    });

    it("should return false if the window does not contain the singleActionPopout query param", () => {
      const win = { location: { search: "" } } as Window;

      expect(BrowserPopupUtils.inSingleActionPopout(win, "123")).toBe(false);
    });
  });

  describe("inPopup", () => {
    it("should return true if the window does not contain the popup query param", () => {
      const win = { location: { search: "" } } as Window;

      expect(BrowserPopupUtils.inPopup(win)).toBe(true);
    });

    it("should return true if the window contains the popup query param", () => {
      const win = { location: { search: "?uilocation=popup" } } as Window;

      expect(BrowserPopupUtils.inPopup(win)).toBe(true);
    });

    it("should return false if the window does not contain the popup query param", () => {
      const win = { location: { search: "?uilocation=sidebar" } } as Window;

      expect(BrowserPopupUtils.inPopup(win)).toBe(false);
    });
  });

  describe("getContentScrollY", () => {
    it("should return the scroll position of the popup", () => {
      const win = {
        document: { getElementsByTagName: () => [{ scrollTop: 100 }] },
      } as unknown as Window;

      expect(BrowserPopupUtils.getContentScrollY(win)).toBe(100);
    });
  });

  describe("setContentScrollY", () => {
    it("should set the scroll position of the popup", () => {
      window.document.body.innerHTML = `
        <main>
          <div></div>
        </main>
      `;

      BrowserPopupUtils.setContentScrollY(window, 200);

      expect(window.document.getElementsByTagName("main")[0].scrollTop).toBe(200);
    });

    it("should not set the scroll position of the popup if the scrollY is null", () => {
      window.document.body.innerHTML = `
        <main>
          <div></div>
        </main>
      `;

      BrowserPopupUtils.setContentScrollY(window, null);

      expect(window.document.getElementsByTagName("main")[0].scrollTop).toBe(0);
    });
  });

  describe("backgroundInitializationRequired", () => {
    it("return true if the background page is a null value", () => {
      jest.spyOn(BrowserApi, "getBackgroundPage").mockReturnValue(null);

      expect(BrowserPopupUtils.backgroundInitializationRequired()).toBe(true);
    });

    it("return false if the background page is not a null value", () => {
      jest.spyOn(BrowserApi, "getBackgroundPage").mockReturnValue({});

      expect(BrowserPopupUtils.backgroundInitializationRequired()).toBe(false);
    });
  });

  describe("loadingInPrivateMode", () => {
    it("returns false if the background requires initialization", () => {
      jest.spyOn(BrowserPopupUtils, "backgroundInitializationRequired").mockReturnValue(false);

      expect(BrowserPopupUtils.loadingInPrivateMode()).toBe(false);
    });

    it("returns false if the manifest version is for version 3", () => {
      jest.spyOn(BrowserPopupUtils, "backgroundInitializationRequired").mockReturnValue(true);
      jest.spyOn(BrowserApi, "manifestVersion", "get").mockReturnValue(3);

      expect(BrowserPopupUtils.loadingInPrivateMode()).toBe(false);
    });

    it("returns true if the background does not require initalization and the manifest version is version 2", () => {
      jest.spyOn(BrowserPopupUtils, "backgroundInitializationRequired").mockReturnValue(true);
      jest.spyOn(BrowserApi, "manifestVersion", "get").mockReturnValue(2);

      expect(BrowserPopupUtils.loadingInPrivateMode()).toBe(true);
    });
  });

  describe("openPopout", () => {
    beforeEach(() => {
      jest.spyOn(BrowserApi, "getWindow").mockResolvedValueOnce({
        id: 1,
        left: 100,
        top: 100,
        focused: false,
        alwaysOnTop: false,
        incognito: false,
        width: 500,
      });
      jest.spyOn(BrowserApi, "createWindow").mockImplementation();
    });

    it("will create a window with the default window options", async () => {
      const url = "popup/index.html";
      jest.spyOn(BrowserPopupUtils as any, "isSingleActionPopoutOpen").mockResolvedValueOnce(false);

      await BrowserPopupUtils.openPopout(url);

      expect(BrowserApi.createWindow).toHaveBeenCalledWith({
        type: "normal",
        focused: true,
        width: 500,
        height: 800,
        left: 85,
        top: 190,
        url: `chrome-extension://id/${url}?uilocation=popout`,
      });
    });

    it("will create a single action popout window", async () => {
      const url = "popup/index.html";
      jest.spyOn(BrowserPopupUtils as any, "isSingleActionPopoutOpen").mockResolvedValueOnce(false);

      await BrowserPopupUtils.openPopout(url, { singleActionKey: "123" });

      expect(BrowserApi.createWindow).toHaveBeenCalledWith({
        type: "normal",
        focused: true,
        width: 500,
        height: 800,
        left: 85,
        top: 190,
        url: `chrome-extension://id/${url}?uilocation=popout&singleActionPopout=123`,
      });
    });

    it("will not create a single action popout window if it is already open", async () => {
      const url = "popup/index.html";
      jest.spyOn(BrowserPopupUtils as any, "isSingleActionPopoutOpen").mockResolvedValueOnce(true);

      await BrowserPopupUtils.openPopout(url, { singleActionKey: "123" });

      expect(BrowserApi.createWindow).not.toHaveBeenCalled();
    });

    it("will create a window with the provided window options", async () => {
      const url = "popup/index.html";
      jest.spyOn(BrowserPopupUtils as any, "isSingleActionPopoutOpen").mockResolvedValueOnce(false);

      await BrowserPopupUtils.openPopout(url, {
        windowOptions: {
          type: "popup",
          focused: false,
          width: 100,
          height: 100,
        },
      });

      expect(BrowserApi.createWindow).toHaveBeenCalledWith({
        type: "popup",
        focused: false,
        width: 100,
        height: 100,
        left: 85,
        top: 190,
        url: `chrome-extension://id/${url}?uilocation=popout`,
      });
    });

    it("will open a single action window if the forceCloseExistingWindows param is true", async () => {
      const url = "popup/index.html";
      jest.spyOn(BrowserPopupUtils as any, "isSingleActionPopoutOpen").mockResolvedValueOnce(true);

      await BrowserPopupUtils.openPopout(url, {
        singleActionKey: "123",
        forceCloseExistingWindows: true,
      });

      expect(BrowserApi.createWindow).toHaveBeenCalledWith({
        type: "normal",
        focused: true,
        width: 500,
        height: 800,
        left: 85,
        top: 190,
        url: `chrome-extension://id/${url}?uilocation=popout&singleActionPopout=123`,
      });
    });
  });

  describe("closeSingleActionPopout", () => {
    it("closes any existing single action popouts", async () => {
      const url = "popup/index.html";
      jest.useFakeTimers();
      jest.spyOn(BrowserApi, "tabsQuery").mockResolvedValueOnce([
        createChromeTabMock({
          id: 10,
          url: `chrome-extension://id/${url}?uilocation=popout&singleActionPopout=123`,
        }),
        createChromeTabMock({
          id: 20,
          url: `chrome-extension://id/${url}?uilocation=popout&singleActionPopout=123`,
        }),
        createChromeTabMock({
          id: 30,
          url: `chrome-extension://id/${url}?uilocation=popout&singleActionPopout=456`,
        }),
      ]);
      jest.spyOn(BrowserApi, "removeTab").mockResolvedValueOnce();

      await BrowserPopupUtils.closeSingleActionPopout("123");
      jest.runOnlyPendingTimers();

      expect(BrowserApi.removeTab).toHaveBeenNthCalledWith(1, 10);
      expect(BrowserApi.removeTab).toHaveBeenNthCalledWith(2, 20);
      expect(BrowserApi.removeTab).not.toHaveBeenCalledWith(30);
    });
  });

  describe("isSingleActionPopoutOpen", () => {
    const windowOptions = {
      id: 1,
      left: 100,
      top: 100,
      focused: false,
      alwaysOnTop: false,
      incognito: false,
      width: 500,
      height: 800,
    };

    beforeEach(() => {
      jest.spyOn(BrowserApi, "updateWindowProperties").mockImplementation();
      jest.spyOn(BrowserApi, "removeTab").mockImplementation();
    });

    it("returns false if the popoutKey is not provided", async () => {
      await expect(BrowserPopupUtils["isSingleActionPopoutOpen"](undefined, {})).resolves.toBe(
        false
      );
    });

    it("returns false if no popout windows are found", async () => {
      jest.spyOn(BrowserApi, "tabsQuery").mockResolvedValueOnce([]);

      await expect(
        BrowserPopupUtils["isSingleActionPopoutOpen"]("123", windowOptions)
      ).resolves.toBe(false);
    });

    it("returns false if no single action popout is found relating to the popoutKey", async () => {
      jest.spyOn(BrowserApi, "tabsQuery").mockResolvedValueOnce([
        createChromeTabMock({
          id: 10,
          url: `chrome-extension://id/popup/index.html?uilocation=popout&singleActionPopout=123`,
        }),
        createChromeTabMock({
          id: 20,
          url: `chrome-extension://id/popup/index.html?uilocation=popout&singleActionPopout=123`,
        }),
        createChromeTabMock({
          id: 30,
          url: `chrome-extension://id/popup/index.html?uilocation=popout&singleActionPopout=456`,
        }),
      ]);

      await expect(
        BrowserPopupUtils["isSingleActionPopoutOpen"]("789", windowOptions)
      ).resolves.toBe(false);
    });

    it("returns true if a single action popout is found relating to the popoutKey", async () => {
      jest.spyOn(BrowserApi, "tabsQuery").mockResolvedValueOnce([
        createChromeTabMock({
          id: 10,
          url: `chrome-extension://id/popup/index.html?uilocation=popout&singleActionPopout=123`,
        }),
        createChromeTabMock({
          id: 20,
          url: `chrome-extension://id/popup/index.html?uilocation=popout&singleActionPopout=123`,
        }),
        createChromeTabMock({
          id: 30,
          url: `chrome-extension://id/popup/index.html?uilocation=popout&singleActionPopout=456`,
        }),
      ]);

      await expect(
        BrowserPopupUtils["isSingleActionPopoutOpen"]("123", windowOptions)
      ).resolves.toBe(true);
      expect(BrowserApi.updateWindowProperties).toHaveBeenCalledWith(2, {
        focused: true,
        width: 500,
        height: 800,
        top: 100,
        left: 100,
      });
      expect(BrowserApi.removeTab).toHaveBeenCalledTimes(1);
    });
  });
});

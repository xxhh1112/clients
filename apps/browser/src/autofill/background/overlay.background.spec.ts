import { mock, mockReset } from "jest-mock-extended";

import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { AuthService } from "@bitwarden/common/auth/services/auth.service";
import { EnvironmentService } from "@bitwarden/common/platform/services/environment.service";
import { I18nService } from "@bitwarden/common/platform/services/i18n.service";
import { SettingsService } from "@bitwarden/common/services/settings.service";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { CipherService } from "@bitwarden/common/vault/services/cipher.service";

import { BrowserApi } from "../../platform/browser/browser-api";
import { BrowserStateService } from "../../platform/services/browser-state.service";
import { createChromeTabMock, createPageDetailMock } from "../jest/autofill-mocks";
import AutofillService from "../services/autofill.service";

import OverlayBackground from "./overlay.background";

const iconServerUrl = "https://icons.bitwarden.com/";

describe("OverlayBackground", () => {
  let overlayBackground: OverlayBackground;
  const cipherService = mock<CipherService>();
  const autofillService = mock<AutofillService>();
  const authService = mock<AuthService>();
  const environmentService = mock<EnvironmentService>({
    getIconsUrl: () => iconServerUrl,
  });
  const settingsService = mock<SettingsService>();
  const stateService = mock<BrowserStateService>();
  const i18nService = mock<I18nService>();

  beforeEach(() => {
    overlayBackground = new OverlayBackground(
      cipherService,
      autofillService,
      authService,
      environmentService,
      settingsService,
      stateService,
      i18nService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockReset(cipherService);
  });

  describe("removePageDetails", () => {
    it("remove the page details for a specific tab from the pageDetailsForTab object", () => {
      const tabId = 1;
      overlayBackground["pageDetailsForTab"][tabId] = [createPageDetailMock()];
      overlayBackground.removePageDetails(tabId);

      expect(overlayBackground["pageDetailsForTab"][tabId]).toBeUndefined();
    });
  });

  describe("updateAutofillOverlayCiphers", () => {
    const url = "https://tacos.com";
    const tab = createChromeTabMock({ url });
    const cipher1 = mock<CipherView>({
      id: "id-1",
      localData: { lastUsedDate: 222 },
      name: "name-1",
      type: CipherType.Login,
      login: { username: "username-1", uri: url },
    });
    const cipher2 = mock<CipherView>({
      id: "id-2",
      localData: { lastUsedDate: 111 },
      name: "name-2",
      type: CipherType.Login,
      login: { username: "username-2", uri: url },
    });

    beforeEach(() => {
      overlayBackground["userAuthStatus"] = AuthenticationStatus.Unlocked;
    });

    it("will return early if the user auth status is not unlocked", async () => {
      overlayBackground["userAuthStatus"] = AuthenticationStatus.Locked;
      jest.spyOn(BrowserApi, "getTabFromCurrentWindowId");
      jest.spyOn(cipherService, "getAllDecryptedForUrl");

      await overlayBackground.updateAutofillOverlayCiphers();

      expect(BrowserApi.getTabFromCurrentWindowId).not.toHaveBeenCalled();
      expect(cipherService.getAllDecryptedForUrl).not.toHaveBeenCalled();
    });

    it("will return early if the tab is undefined", async () => {
      jest.spyOn(BrowserApi, "getTabFromCurrentWindowId").mockResolvedValue(undefined);
      jest.spyOn(cipherService, "getAllDecryptedForUrl");

      await overlayBackground.updateAutofillOverlayCiphers();

      expect(BrowserApi.getTabFromCurrentWindowId).toHaveBeenCalled();
      expect(cipherService.getAllDecryptedForUrl).not.toHaveBeenCalled();
    });

    it("will query all ciphers for the given url, sort them by last used, and format them for usage in the overlay", async () => {
      jest.spyOn(BrowserApi, "getTabFromCurrentWindowId").mockResolvedValue(tab);
      cipherService.getAllDecryptedForUrl.mockResolvedValue([cipher1, cipher2]);
      cipherService.sortCiphersByLastUsedThenName.mockReturnValue(-1);
      jest.spyOn(BrowserApi, "tabSendMessageData").mockImplementation();
      jest.spyOn(overlayBackground as any, "getOverlayCipherData");

      await overlayBackground.updateAutofillOverlayCiphers();

      expect(BrowserApi.getTabFromCurrentWindowId).toHaveBeenCalled();
      expect(cipherService.getAllDecryptedForUrl).toHaveBeenCalledWith(url);
      expect(overlayBackground["cipherService"].sortCiphersByLastUsedThenName).toHaveBeenCalled();
      expect(overlayBackground["overlayLoginCiphers"]).toStrictEqual(
        new Map([
          ["overlay-cipher-0", cipher2],
          ["overlay-cipher-1", cipher1],
        ])
      );
      expect(overlayBackground["getOverlayCipherData"]).toHaveBeenCalled();
    });

    it("will post an `updateOverlayListCiphers` message to the overlay list port, and send a `updateIsOverlayCiphersPopulated` message to the tab indicating that the list of ciphers is populated", async () => {
      overlayBackground["overlayListPort"] = mock<chrome.runtime.Port>();
      cipherService.getAllDecryptedForUrl.mockResolvedValue([cipher1, cipher2]);
      cipherService.sortCiphersByLastUsedThenName.mockReturnValue(-1);
      jest.spyOn(BrowserApi, "getTabFromCurrentWindowId").mockResolvedValue(tab);
      jest.spyOn(BrowserApi, "tabSendMessageData").mockImplementation();

      await overlayBackground.updateAutofillOverlayCiphers();

      expect(overlayBackground["overlayListPort"].postMessage).toHaveBeenCalledWith({
        command: "updateOverlayListCiphers",
        ciphers: [
          {
            card: null,
            favorite: cipher2.favorite,
            icon: {
              fallbackImage: "images/bwi-globe.png",
              icon: "bwi-globe",
              image: "https://icons.bitwarden.com//tacos.com/icon.png",
              imageEnabled: true,
            },
            id: "overlay-cipher-0",
            login: {
              username: "us*******2",
            },
            name: "name-2",
            reprompt: cipher2.reprompt,
            type: 1,
          },
          {
            card: null,
            favorite: cipher1.favorite,
            icon: {
              fallbackImage: "images/bwi-globe.png",
              icon: "bwi-globe",
              image: "https://icons.bitwarden.com//tacos.com/icon.png",
              imageEnabled: true,
            },
            id: "overlay-cipher-1",
            login: {
              username: "us*******1",
            },
            name: "name-1",
            reprompt: cipher1.reprompt,
            type: 1,
          },
        ],
      });
      expect(BrowserApi.tabSendMessageData).toHaveBeenCalledWith(
        tab,
        "updateIsOverlayCiphersPopulated",
        { isOverlayCiphersPopulated: true }
      );
    });
  });

  describe("initOverlayBackground", () => {
    it("will set up the extension message listeners, get the overlay's visibility settings, and get the user's auth status", async () => {
      overlayBackground["setupExtensionMessageListeners"] = jest.fn();
      overlayBackground["getOverlayVisibility"] = jest.fn();
      overlayBackground["getAuthStatus"] = jest.fn();

      await overlayBackground["initOverlayBackground"]();

      expect(overlayBackground["setupExtensionMessageListeners"]).toHaveBeenCalled();
      expect(overlayBackground["getOverlayVisibility"]).toHaveBeenCalled();
      expect(overlayBackground["getAuthStatus"]).toHaveBeenCalled();
    });
  });

  describe("getOverlayCipherData", () => {
    const url = "https://tacos.com";
    const cipher1 = mock<CipherView>({
      id: "id-1",
      localData: { lastUsedDate: 222 },
      name: "name-1",
      type: CipherType.Login,
      login: { username: "username-1", uri: url },
    });
    const cipher2 = mock<CipherView>({
      id: "id-2",
      localData: { lastUsedDate: 111 },
      name: "name-2",
      type: CipherType.Login,
      login: { username: "username-2", uri: url },
    });
    const cipher3 = mock<CipherView>({
      id: "id-3",
      localData: { lastUsedDate: 333 },
      name: "name-3",
      type: CipherType.Card,
      card: { number: "123456789", brand: "visa" },
    });

    it("will return an array of formatted cipher data", () => {
      overlayBackground["overlayLoginCiphers"] = new Map([
        ["overlay-cipher-0", cipher2],
        ["overlay-cipher-1", cipher1],
        ["overlay-cipher-2", cipher3],
      ]);

      const overlayCipherData = overlayBackground["getOverlayCipherData"]();

      expect(overlayCipherData).toStrictEqual([
        {
          card: null,
          favorite: cipher2.favorite,
          icon: {
            fallbackImage: "images/bwi-globe.png",
            icon: "bwi-globe",
            image: "https://icons.bitwarden.com//tacos.com/icon.png",
            imageEnabled: true,
          },
          id: "overlay-cipher-0",
          login: {
            username: "us*******2",
          },
          name: "name-2",
          reprompt: cipher2.reprompt,
          type: 1,
        },
        {
          card: null,
          favorite: cipher1.favorite,
          icon: {
            fallbackImage: "images/bwi-globe.png",
            icon: "bwi-globe",
            image: "https://icons.bitwarden.com//tacos.com/icon.png",
            imageEnabled: true,
          },
          id: "overlay-cipher-1",
          login: {
            username: "us*******1",
          },
          name: "name-1",
          reprompt: cipher1.reprompt,
          type: 1,
        },
        {
          card: {
            brand: "visa",
            partialNumber: "*6789",
          },
          favorite: cipher3.favorite,
          icon: {
            fallbackImage: "",
            icon: "bwi-credit-card",
            image: undefined,
            imageEnabled: true,
          },
          id: "overlay-cipher-2",
          login: null,
          name: "name-3",
          reprompt: cipher3.reprompt,
          type: 3,
        },
      ]);
    });
  });
});

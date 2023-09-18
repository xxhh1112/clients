import { BrowserApi } from "../../../platform/browser/browser-api";
import BrowserPopupUtils from "../../../platform/popup/browser-popup-utils";

import {
  VaultPopoutType,
  openCurrentPagePopout,
  openVaultItemPasswordRepromptPopout,
  openAddEditVaultItemPopout,
  closeAddEditVaultItemPopout,
} from "./vault-popout-window";

describe("VaultPopoutWindow", () => {
  const openPopoutSpy = jest.spyOn(BrowserPopupUtils, "openPopout").mockImplementation();
  const closeSingleActionPopoutSpy = jest
    .spyOn(BrowserPopupUtils, "closeSingleActionPopout")
    .mockImplementation();
  const closePopupSpy = jest.spyOn(BrowserApi, "closePopup").mockImplementation();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("openCurrentPagePopout", () => {
    it("opens a popout window for the current page", async () => {
      const win = { location: { href: "https://example.com#/tabs/current" } } as Window;
      jest.spyOn(BrowserPopupUtils, "inPopup").mockReturnValue(false);

      await openCurrentPagePopout(win);

      expect(openPopoutSpy).toHaveBeenCalledWith("/#/tabs/vault");
      expect(closePopupSpy).not.toHaveBeenCalled();
    });

    it("opens a popout window for the specified URL", async () => {
      const win = {} as Window;
      jest.spyOn(BrowserPopupUtils, "inPopup").mockReturnValue(false);

      await openCurrentPagePopout(win, "https://example.com#/settings");

      expect(openPopoutSpy).toHaveBeenCalledWith("/#/settings");
    });

    it("opens a popout window for the current page and closes the popup window", async () => {
      const win = { location: { href: "https://example.com/#/tabs/vault" } } as Window;
      jest.spyOn(BrowserPopupUtils, "inPopup").mockReturnValue(true);

      await openCurrentPagePopout(win);

      expect(openPopoutSpy).toHaveBeenCalledWith("/#/tabs/vault");
      expect(closePopupSpy).toHaveBeenCalledWith(win);
    });
  });

  describe("openVaultItemPasswordRepromptPopout", () => {
    it("opens a popout window that facilitates re-prompting for the password of a vault item", async () => {
      const senderTab = { windowId: 1 } as chrome.tabs.Tab;

      await openVaultItemPasswordRepromptPopout(senderTab, {
        cipherId: "cipherId",
        action: "action",
      });

      expect(openPopoutSpy).toHaveBeenCalledWith(
        "popup/index.html#/view-cipher?cipherId=cipherId&senderTabId=undefined&action=action",
        {
          singleActionKey: `${VaultPopoutType.vaultItemPasswordReprompt}_cipherId`,
          senderWindowId: 1,
          forceCloseExistingWindows: true,
        }
      );
    });
  });

  describe("openAddEditVaultItemPopout", () => {
    it("opens a popout window that facilitates adding a vault item", async () => {
      await openAddEditVaultItemPopout(1);

      expect(openPopoutSpy).toHaveBeenCalledWith("popup/index.html#/edit-cipher", {
        singleActionKey: VaultPopoutType.addEditVaultItem,
        senderWindowId: 1,
      });
    });

    it("opens a popout window that facilitates editing a vault item", async () => {
      await openAddEditVaultItemPopout(1, "cipherId");

      expect(openPopoutSpy).toHaveBeenCalledWith(
        "popup/index.html#/edit-cipher?cipherId=cipherId",
        {
          singleActionKey: VaultPopoutType.addEditVaultItem,
          senderWindowId: 1,
        }
      );
    });
  });

  describe("closeAddEditVaultItemPopout", () => {
    it("closes the add/edit vault item popout window", () => {
      closeAddEditVaultItemPopout();

      expect(closeSingleActionPopoutSpy).toHaveBeenCalledWith(VaultPopoutType.addEditVaultItem, 0);
    });

    it("closes the add/edit vault item popout window after a delay", () => {
      closeAddEditVaultItemPopout(1000);

      expect(closeSingleActionPopoutSpy).toHaveBeenCalledWith(
        VaultPopoutType.addEditVaultItem,
        1000
      );
    });
  });
});

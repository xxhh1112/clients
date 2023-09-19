import BrowserPopupUtils from "../../../platform/popup/browser-popup-utils";

const VaultPopoutType = {
  vaultItemPasswordReprompt: "vault_PasswordReprompt",
  addEditVaultItem: "vault_AddEditVaultItem",
} as const;

/**
 * Opens a popout window that facilitates re-prompting for
 * the password of a vault item.
 *
 * @param senderTab - The tab that sent the request.
 * @param cipherOptions - The cipher id and action to perform.
 */
async function openVaultItemPasswordRepromptPopout(
  senderTab: chrome.tabs.Tab,
  cipherOptions: {
    cipherId: string;
    action: string;
  }
) {
  const { cipherId, action } = cipherOptions;
  const promptWindowPath =
    "popup/index.html#/view-cipher" +
    `?cipherId=${cipherId}` +
    `&senderTabId=${senderTab.id}` +
    `&action=${action}`;

  await BrowserPopupUtils.openPopout(promptWindowPath, {
    singleActionKey: `${VaultPopoutType.vaultItemPasswordReprompt}_${cipherId}`,
    senderWindowId: senderTab.windowId,
    forceCloseExistingWindows: true,
  });
}

/**
 * Opens a popout window that facilitates adding or editing a vault item.
 *
 * @param senderWindowId - The window id of the sender.
 * @param cipherId - The cipher id to edit. If not provided, a new cipher will be created.
 */
async function openAddEditVaultItemPopout(senderWindowId: number, cipherId?: string) {
  const addEditCipherUrl =
    cipherId == null
      ? "popup/index.html#/edit-cipher"
      : `popup/index.html#/edit-cipher?cipherId=${cipherId}`;

  await BrowserPopupUtils.openPopout(addEditCipherUrl, {
    singleActionKey: VaultPopoutType.addEditVaultItem,
    senderWindowId,
  });
}

/**
 * Closes the add/edit vault item popout window.
 *
 * @param delayClose - The amount of time to wait before closing the popout. Defaults to 0.
 */
async function closeAddEditVaultItemPopout(delayClose = 0) {
  await BrowserPopupUtils.closeSingleActionPopout(VaultPopoutType.addEditVaultItem, delayClose);
}

export {
  VaultPopoutType,
  openVaultItemPasswordRepromptPopout,
  openAddEditVaultItemPopout,
  closeAddEditVaultItemPopout,
};

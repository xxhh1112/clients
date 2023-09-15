import PopoutWindow from "../../../platform/popup/popout-window";

const VaultPopoutType = {
  vaultItemPasswordReprompt: "vault_PasswordReprompt",
  addEditVaultItem: "vault_AddEditVaultItem",
} as const;

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
    "?uilocation=popout" +
    `&cipherId=${cipherId}` +
    `&senderTabId=${senderTab.id}` +
    `&action=${action}`;

  await PopoutWindow.open(promptWindowPath, {
    singleActionKey: VaultPopoutType.vaultItemPasswordReprompt,
    senderWindowId: senderTab.windowId,
  });
}

async function openAddEditVaultItemPopout(senderWindowId: number, cipherId?: string) {
  const addEditCipherUrl =
    cipherId == null
      ? "popup/index.html#/edit-cipher"
      : `popup/index.html#/edit-cipher?cipherId=${cipherId}`;

  await PopoutWindow.open(addEditCipherUrl, {
    singleActionKey: VaultPopoutType.addEditVaultItem,
    senderWindowId,
  });
}

async function closeAddEditVaultItemPopout(delayClose = 0) {
  await PopoutWindow.closeSingleAction(VaultPopoutType.addEditVaultItem, delayClose);
}

export {
  VaultPopoutType,
  openVaultItemPasswordRepromptPopout,
  openAddEditVaultItemPopout,
  closeAddEditVaultItemPopout,
};

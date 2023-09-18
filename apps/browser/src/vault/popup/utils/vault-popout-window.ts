import { BrowserApi } from "../../../platform/browser/browser-api";
import PopoutWindow from "../../../platform/popup/popout-window";

const VaultPopoutType = {
  viewVaultItem: "vault_viewVaultItem",
  addEditVaultItem: "vault_AddEditVaultItem",
} as const;

async function openViewVaultItemPopout(
  senderTab: chrome.tabs.Tab,
  cipherOptions: {
    cipherId: string;
    action: string;
    forceCloseExistingWindows?: boolean;
  }
) {
  const { cipherId, action, forceCloseExistingWindows } = cipherOptions;
  let promptWindowPath = "popup/index.html#/view-cipher?uilocation=popout";
  if (cipherId) {
    promptWindowPath += `&cipherId=${cipherId}`;
  }
  if (senderTab.id) {
    promptWindowPath += `&senderTabId=${senderTab.id}`;
  }
  if (action) {
    promptWindowPath += `&action=${action}`;
  }

  await PopoutWindow.open(promptWindowPath, {
    singleActionKey: `${VaultPopoutType.viewVaultItem}_${cipherId}`,
    senderWindowId: senderTab.windowId,
    forceCloseExistingWindows,
  });
}

async function closeViewVaultItemPopout(singleActionKey: string, delayClose = 0) {
  await PopoutWindow.closeSingleAction(singleActionKey, delayClose);
}

async function openVaultItemPasswordRepromptPopout(
  senderTab: chrome.tabs.Tab,
  cipherOptions: {
    cipherId: string;
    action: string;
  }
) {
  await openViewVaultItemPopout(senderTab, {
    forceCloseExistingWindows: true,
    ...cipherOptions,
  });
  await BrowserApi.tabSendMessageData(senderTab, "bgVaultItemRepromptOpened");
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
  openViewVaultItemPopout,
  closeViewVaultItemPopout,
  openVaultItemPasswordRepromptPopout,
  openAddEditVaultItemPopout,
  closeAddEditVaultItemPopout,
};

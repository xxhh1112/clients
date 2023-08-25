type OverlayBackgroundExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  openAutofillOverlay: () => void;
  autofillOverlayElementClosed: ({ message }: { message: any }) => void;
  autofillOverlayAddNewVaultItem: ({
    message,
    sender,
  }: {
    message: any;
    sender: chrome.runtime.MessageSender;
  }) => void;
  checkAutofillOverlayFocused: () => void;
  focusAutofillOverlayList: () => void;
  updateAutofillOverlayPosition: ({ message }: { message: any }) => void;
  updateAutofillOverlayHidden: ({ message }: { message: any }) => void;
  updateFocusedFieldData: ({ message }: { message: any }) => void;
  collectPageDetailsResponse: ({
    message,
    sender,
  }: {
    message: any;
    sender: chrome.runtime.MessageSender;
  }) => void;
  unlockCompleted: () => void;
  addEditCipherSubmitted: () => void;
  deletedCipher: () => void;
};
type OverlayButtonPortMessageHandlers = {
  [key: string]: CallableFunction;
  overlayButtonClicked: ({ port }: { port: chrome.runtime.Port }) => void;
  closeAutofillOverlay: ({ port }: { port: chrome.runtime.Port }) => void;
  overlayButtonBlurred: () => void;
};

type OverlayListPortMessageHandlers = {
  [key: string]: CallableFunction;
  checkAutofillOverlayButtonFocused: () => void;
  unlockVault: ({ port }: { port: chrome.runtime.Port }) => void;
  autofillSelectedListItem: ({
    message,
    port,
  }: {
    message: any;
    port: chrome.runtime.Port;
  }) => void;
  updateAutofillOverlayListHeight: ({ message }: { message: any }) => void;
  addNewVaultItem: () => void;
  viewSelectedCipher: ({ message, port }: { message: any; port: chrome.runtime.Port }) => void;
  redirectOverlayFocusOut: ({ message, port }: { message: any; port: chrome.runtime.Port }) => void;
};

export {
  OverlayBackgroundExtensionMessageHandlers,
  OverlayButtonPortMessageHandlers,
  OverlayListPortMessageHandlers,
};

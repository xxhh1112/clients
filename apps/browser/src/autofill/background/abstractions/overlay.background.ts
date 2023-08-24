import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

type OverlayBackgroundExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  bgOpenAutofillOverlayList: () => void;
  bgCheckOverlayFocused: () => void;
  bgCheckAuthStatus: () => Promise<AuthenticationStatus>;
  bgUpdateAutofillOverlayButtonPosition: () => void;
  bgUpdateAutofillOverlayListPosition: () => void;
  bgUpdateOverlayHidden: ({ message }: { message: any }) => void;
  bgUpdateFocusedFieldData: ({ message }: { message: any }) => void;
  bgAutofillOverlayButtonClosed: () => void;
  bgAutofillOverlayListClosed: () => void;
  bgAddNewVaultItem: ({
    message,
    sender,
  }: {
    message: any;
    sender: chrome.runtime.MessageSender;
  }) => void;
  bgFocusAutofillOverlayList: () => void;
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
  checkOverlayButtonFocused: () => void;
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

import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

type OverlayBackgroundExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  bgOpenAutofillOverlayList: () => void;
  bgCheckOverlayFocused: () => void;
  bgCheckAuthStatus: () => Promise<AuthenticationStatus>;
  bgUpdateAutofillOverlayIconPosition: () => void;
  bgUpdateAutofillOverlayListPosition: () => void;
  bgUpdateFocusedFieldData: ({ message }: { message: any }) => void;
  bgAutofillOverlayIconClosed: () => void;
  bgAutofillOverlayListClosed: () => void;
  bgAddNewVaultItem: ({
    message,
    sender,
  }: {
    message: any;
    sender: chrome.runtime.MessageSender;
  }) => void;
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
type OverlayIconPortMessageHandlers = {
  [key: string]: CallableFunction;
  overlayIconClicked: ({ port }: { port: chrome.runtime.Port }) => void;
  closeAutofillOverlay: ({ port }: { port: chrome.runtime.Port }) => void;
  overlayIconBlurred: () => void;
};

type OverlayListPortMessageHandlers = {
  [key: string]: CallableFunction;
  checkOverlayIconFocused: () => void;
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
};

export {
  OverlayBackgroundExtensionMessageHandlers,
  OverlayIconPortMessageHandlers,
  OverlayListPortMessageHandlers,
};

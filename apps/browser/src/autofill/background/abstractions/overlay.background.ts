import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

type OverlayBackgroundExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  bgOpenAutofillOverlayList: () => void;
  bgCheckOverlayFocused: () => void;
  bgCheckAuthStatus: () => Promise<AuthenticationStatus>;
  bgAutofillOverlayIconClosed: () => void;
  bgAutofillOverlayListClosed: () => void;
  collectPageDetailsResponse: ({
    message,
    sender,
  }: {
    message: any;
    sender: chrome.runtime.MessageSender;
  }) => void;
  unlockCompleted: () => void;
};
type OverlayIconPortMessageHandlers = {
  [key: string]: CallableFunction;
  overlayIconClicked: () => void;
  closeAutofillOverlay: () => void;
  overlayIconBlurred: () => void;
};

type OverlayListPortMessageHandlers = {
  [key: string]: CallableFunction;
  closeAutofillOverlay: () => void;
  overlayListBlurred: () => void;
  unlockVault: ({ port }: { port: chrome.runtime.Port }) => void;
  autofillSelectedListItem: ({
    message,
    port,
  }: {
    message: any;
    port: chrome.runtime.Port;
  }) => void;
};

export {
  OverlayBackgroundExtensionMessageHandlers,
  OverlayIconPortMessageHandlers,
  OverlayListPortMessageHandlers,
};

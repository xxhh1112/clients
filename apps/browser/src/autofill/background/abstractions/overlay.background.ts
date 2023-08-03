import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

type OverlayBackgroundExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  bgOpenAutofillOverlayList: () => void;
  bgAutofillOverlayListItem: ({
    message,
    sender,
  }: {
    message: any;
    sender: chrome.runtime.MessageSender;
  }) => void;
  bgCheckOverlayFocused: () => void;
  bgOverlayUnlockVault: ({ sender }: { sender: chrome.runtime.MessageSender }) => Promise<void>;
  bgCheckAuthStatus: () => Promise<AuthenticationStatus>;
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
};

export { OverlayBackgroundExtensionMessageHandlers, OverlayIconPortMessageHandlers };

import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

type OverlayBackgroundExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  bgUpdateAutofillOverlayListSender: ({ sender }: { sender: chrome.runtime.MessageSender }) => void;
  bgOpenAutofillOverlayList: () => void;
  bgGetAutofillOverlayList: ({ sender }: { sender: chrome.runtime.MessageSender }) => void;
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
  collectPageDetailsResponse: ({ message }: { message: any }) => void;
  unlockCompleted: () => void;
};

export { OverlayBackgroundExtensionMessageHandlers };

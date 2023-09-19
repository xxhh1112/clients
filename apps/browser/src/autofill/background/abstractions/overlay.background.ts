import { CipherRepromptType } from "@bitwarden/common/vault/enums/cipher-reprompt-type";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";

import AutofillPageDetails from "../../models/autofill-page-details";

type OverlayAddNewItemMessage = {
  login: {
    uri?: string;
    hostname: string;
    username: string;
    password: string;
  };
};

type OverlayBackgroundExtensionMessage = {
  [key: string]: any;
  command: string;
  tab?: chrome.tabs.Tab;
  sender?: string;
  details?: AutofillPageDetails;
  overlayCipherId?: string;
  overlayElement?: string;
  direction?: string;
  display?: string;
  data?: {
    commandToRetry?: {
      msg?: {
        command?: string;
      };
    };
  };
} & OverlayAddNewItemMessage;

type FocusedFieldData = {
  focusedFieldStyles: Partial<CSSStyleDeclaration>;
  focusedFieldRects: Partial<DOMRect>;
};

type OverlayCipherData = {
  id: string;
  name: string;
  type: CipherType;
  reprompt: CipherRepromptType;
  favorite: boolean;
  icon: { imageEnabled: boolean; image: string; fallbackImage: string; icon: string };
  login?: { username: string };
  card?: { brand: string; partialNumber: string };
};

type OverlayBackgroundExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  openAutofillOverlay: () => void;
  autofillOverlayElementClosed: ({
    message,
  }: {
    message: OverlayBackgroundExtensionMessage;
  }) => void;
  autofillOverlayAddNewVaultItem: ({
    message,
    sender,
  }: {
    message: OverlayBackgroundExtensionMessage;
    sender: chrome.runtime.MessageSender;
  }) => void;
  getAutofillOverlayVisibility: () => void;
  checkAutofillOverlayFocused: () => void;
  focusAutofillOverlayList: () => void;
  updateAutofillOverlayPosition: ({
    message,
  }: {
    message: OverlayBackgroundExtensionMessage;
  }) => void;
  updateAutofillOverlayHidden: ({
    message,
  }: {
    message: OverlayBackgroundExtensionMessage;
  }) => void;
  updateFocusedFieldData: ({ message }: { message: OverlayBackgroundExtensionMessage }) => void;
  collectPageDetailsResponse: ({
    message,
    sender,
  }: {
    message: OverlayBackgroundExtensionMessage;
    sender: chrome.runtime.MessageSender;
  }) => void;
  unlockCompleted: ({ message }: { message: OverlayBackgroundExtensionMessage }) => void;
  addEditCipherSubmitted: () => void;
  deletedCipher: () => void;
};

type OverlayButtonPortMessageHandlers = {
  [key: string]: CallableFunction;
  overlayButtonClicked: ({ port }: { port: chrome.runtime.Port }) => void;
  closeAutofillOverlay: ({ port }: { port: chrome.runtime.Port }) => void;
  overlayPageBlurred: () => void;
  redirectOverlayFocusOut: ({
    message,
    port,
  }: {
    message: OverlayBackgroundExtensionMessage;
    port: chrome.runtime.Port;
  }) => void;
};

type OverlayListPortMessageHandlers = {
  [key: string]: CallableFunction;
  checkAutofillOverlayButtonFocused: () => void;
  overlayPageBlurred: () => void;
  unlockVault: ({ port }: { port: chrome.runtime.Port }) => void;
  autofillSelectedListItem: ({
    message,
    port,
  }: {
    message: OverlayBackgroundExtensionMessage;
    port: chrome.runtime.Port;
  }) => void;
  addNewVaultItem: ({ port }: { port: chrome.runtime.Port }) => void;
  viewSelectedCipher: ({
    message,
    port,
  }: {
    message: OverlayBackgroundExtensionMessage;
    port: chrome.runtime.Port;
  }) => void;
  redirectOverlayFocusOut: ({
    message,
    port,
  }: {
    message: OverlayBackgroundExtensionMessage;
    port: chrome.runtime.Port;
  }) => void;
};

interface OverlayBackground {
  removePageDetails(tabId: number): void;
  updateAutofillOverlayCiphers(): void;
}

export {
  OverlayBackgroundExtensionMessage,
  FocusedFieldData,
  OverlayCipherData,
  OverlayAddNewItemMessage,
  OverlayBackgroundExtensionMessageHandlers,
  OverlayButtonPortMessageHandlers,
  OverlayListPortMessageHandlers,
  OverlayBackground,
};

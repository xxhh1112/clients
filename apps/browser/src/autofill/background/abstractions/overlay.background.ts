import { CipherRepromptType } from "@bitwarden/common/vault/enums/cipher-reprompt-type";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";

import AutofillPageDetails from "../../models/autofill-page-details";

type OverlayBackgroundExtensionMessage = {
  [key: string]: any;
  command: string;
  tab?: chrome.tabs.Tab;
  sender?: string;
  details?: AutofillPageDetails;
  overlayCipherId?: string;
  overlayElement?: string;
};

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
  unlockCompleted: ({
    message,
    sender,
  }: {
    message: OverlayBackgroundExtensionMessage;
    sender: chrome.runtime.MessageSender;
  }) => void;
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
  addNewVaultItem: ({ port }: { port: chrome.runtime.Port }) => void;
  viewSelectedCipher: ({ message, port }: { message: any; port: chrome.runtime.Port }) => void;
  redirectOverlayFocusOut: ({ message, port }: { message: any; port: chrome.runtime.Port }) => void;
};

interface OverlayBackground {
  removePageDetails(tabId: number): void;
  updateAutofillOverlayCiphers(): void;
}

export {
  OverlayBackgroundExtensionMessage,
  FocusedFieldData,
  OverlayCipherData,
  OverlayBackgroundExtensionMessageHandlers,
  OverlayButtonPortMessageHandlers,
  OverlayListPortMessageHandlers,
  OverlayBackground,
};

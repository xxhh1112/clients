import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import AutofillScript from "../../models/autofill-script";

type AutofillExtensionMessage = {
  command: string;
  tab?: chrome.tabs.Tab;
  sender?: string;
  fillScript?: AutofillScript;
  ciphers?: any;
  data?: {
    authStatus?: AuthenticationStatus;
    focusFieldElement?: boolean;
  };
};

type AutofillExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  collectPageDetails: (message: { message: AutofillExtensionMessage }) => void;
  collectPageDetailsImmediately: (message: { message: AutofillExtensionMessage }) => void;
  fillForm: (message: { message: AutofillExtensionMessage }) => void;
  openAutofillOverlay: (message: { message: AutofillExtensionMessage }) => void;
  closeAutofillOverlay: () => void;
  addNewVaultItemFromOverlay: () => void;
  redirectOverlayFocusOut: ({ message }: { message: any }) => void;
  promptForLogin: () => void;
  passwordReprompt: () => void;
};

interface AutofillInit {
  init(): void;
}

export { AutofillExtensionMessage, AutofillExtensionMessageHandlers, AutofillInit };

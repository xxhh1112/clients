import AutofillScript from "./autofill-script";

type AutofillExtensionMessage = {
  command: string;
  tab?: chrome.tabs.Tab;
  sender?: string;
  fillScript?: AutofillScript;
};

type AutofillExtensionMessageHandlers = {
  [key: string]: ({
    message,
    sender,
  }: {
    message: AutofillExtensionMessage;
    sender: chrome.runtime.MessageSender;
  }) => any;
};

interface AutofillInit {
  init(): void;
}

declare global {
  interface Window {
    bitwardenAutofillInit: AutofillInit;
  }
}

export { AutofillExtensionMessage, AutofillExtensionMessageHandlers, AutofillInit };

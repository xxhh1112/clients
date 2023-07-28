type OverlayBackgroundExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  bgOpenAutofillOverlayList: () => void;
  bgGetAutofillOverlayList: ({ sender }: { sender: chrome.runtime.MessageSender }) => void;
  bgAutofillOverlayListItem: ({
    message,
    sender,
  }: {
    message: any;
    sender: chrome.runtime.MessageSender;
  }) => void;
  collectPageDetailsResponse: ({ message }: { message: any }) => void;
  bgCheckOverlayFocused: () => void;
};

export { OverlayBackgroundExtensionMessageHandlers };

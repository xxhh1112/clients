type OverlayListWindowMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillOverlayList: ({ message }: { message: any }) => void;
  checkOverlayListFocused: () => void;
  updateContextualCiphers: ({ message }: { message: any }) => void;
};

export { OverlayListWindowMessageHandlers };

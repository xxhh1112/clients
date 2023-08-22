type OverlayListWindowMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillOverlayList: ({ message }: { message: any }) => void;
  checkOverlayListFocused: () => void;
  updateOverlayListCiphers: ({ message }: { message: any }) => void;
  focusOverlayList: () => void;
};

export { OverlayListWindowMessageHandlers };

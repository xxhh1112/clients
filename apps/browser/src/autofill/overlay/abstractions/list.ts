type OverlayListWindowMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillOverlayList: ({ message }: { message: any }) => void;
  checkOverlayListFocused: () => void;
};

export { OverlayListWindowMessageHandlers };

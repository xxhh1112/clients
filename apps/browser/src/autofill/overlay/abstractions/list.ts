type OverlayListPortMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillOverlayList: ({ message }: { message: any }) => void;
  checkOverlayFocused: () => void;
};

export { OverlayListPortMessageHandlers };

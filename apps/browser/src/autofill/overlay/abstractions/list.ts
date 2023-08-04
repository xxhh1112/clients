type OverlayListPortMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillOverlayList: ({ message }: { message: any }) => void;
  checkOverlayListFocused: () => void;
};

export { OverlayListPortMessageHandlers };

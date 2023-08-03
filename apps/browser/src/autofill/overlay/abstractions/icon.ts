type OverlayIconPortMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillOverlayIcon: ({ message }: { message: any }) => void;
};

export { OverlayIconPortMessageHandlers };

type OverlayIconWindowMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillOverlayIcon: ({ message }: { message: any }) => void;
};

export { OverlayIconWindowMessageHandlers };

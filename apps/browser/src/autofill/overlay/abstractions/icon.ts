type OverlayIconPortMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillOverlayIcon: ({ message }: { message: any }) => void;
  updateAuthStatus: ({ message }: { message: any }) => void;
};

export { OverlayIconPortMessageHandlers };

type OverlayIconWindowMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillOverlayIcon: ({ message }: { message: any }) => void;
  checkOverlayIconFocused: () => void;
  updateAuthStatus: ({ message }: { message: any }) => void;
};

export { OverlayIconWindowMessageHandlers };

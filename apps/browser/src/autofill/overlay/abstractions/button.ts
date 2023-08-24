type OverlayButtonWindowMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillOverlayButton: ({ message }: { message: any }) => void;
  checkOverlayButtonFocused: () => void;
  updateAuthStatus: ({ message }: { message: any }) => void;
};

export { OverlayButtonWindowMessageHandlers };

type OverlayListExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  updateAutofillOverlayList: (message: { message: any }) => void;
  checkOverlayFocused: () => void;
};

export { OverlayListExtensionMessageHandlers };

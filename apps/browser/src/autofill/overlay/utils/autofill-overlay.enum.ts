const AutofillOverlayCustomElement = {
  Button: "autofill-overlay-button",
  List: "autofill-overlay-list",
  BitwardenButton: "bitwarden-autofill-overlay-button",
  BitwardenList: "bitwarden-autofill-overlay-list",
} as const;

const AutofillOverlayPort = {
  Button: "autofill-overlay-button-port",
  List: "autofill-overlay-list-port",
} as const;

const RedirectFocusDirection = {
  Current: "current",
  Previous: "previous",
  Next: "next",
} as const;

export { AutofillOverlayCustomElement, AutofillOverlayPort, RedirectFocusDirection };

const AutofillOverlayCustomElement = {
  Icon: "autofill-overlay-icon",
  List: "autofill-overlay-list",
  BitwardenIcon: "bitwarden-autofill-overlay-icon",
  BitwardenList: "bitwarden-autofill-overlay-list",
} as const;

const AutofillOverlayPort = {
  Icon: "autofill-overlay-icon-port",
  List: "autofill-overlay-list-port",
} as const;

const RedirectFocusDirection = {
  Current: "current",
  Previous: "previous",
  Next: "next",
} as const;

export { AutofillOverlayCustomElement, AutofillOverlayPort, RedirectFocusDirection };

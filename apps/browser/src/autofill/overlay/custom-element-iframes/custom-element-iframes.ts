import { AutofillOverlayPort } from "../utils/autofill-overlay.enum";

import OverlayIframeService from "./overlay-iframe.service";

class AutofillOverlayCustomElementIframe extends HTMLElement {
  constructor(
    iframePath: string,
    portName: string,
    initStyles: Partial<CSSStyleDeclaration>,
    ariaAlert?: string
  ) {
    super();

    const shadow: ShadowRoot = this.attachShadow({ mode: "closed" });
    const overlayIframeService = new OverlayIframeService(iframePath, portName, shadow);
    overlayIframeService.initOverlayIframe(initStyles, ariaAlert);
  }
}

class AutofillOverlayIconIframe extends AutofillOverlayCustomElementIframe {
  constructor() {
    super(
      "overlay/icon.html",
      AutofillOverlayPort.Icon,
      {
        background: "transparent",
        border: "none",
      },
      "Bitwarden menu available. Press the down arrow key to select."
    );
  }
}

class AutofillOverlayListIframe extends AutofillOverlayCustomElementIframe {
  constructor() {
    super("overlay/list.html", AutofillOverlayPort.List, {
      height: "0px",
      minWidth: "250px",
      maxHeight: "180px",
      boxShadow: "rgba(0, 0, 0, 0.1) 2px 4px 6px 0px",
      borderRadius: "4px",
      border: "1px solid rgb(206, 212, 220)",
      backgroundColor: "rgb(255, 255, 255)",
    });
  }
}

export { AutofillOverlayIconIframe, AutofillOverlayListIframe };

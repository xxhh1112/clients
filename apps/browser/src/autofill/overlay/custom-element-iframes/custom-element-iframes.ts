import { AutofillOverlayPort } from "../utils/autofill-overlay.enum";

import OverlayIframeService from "./overlay-iframe.service";

class AutofillOverlayCustomElementIframe extends HTMLElement {
  constructor(iframePath: string, portName: string, initStyles?: Partial<CSSStyleDeclaration>) {
    super();

    const shadow: ShadowRoot = this.attachShadow({ mode: "closed" });
    const overlayIframeService = new OverlayIframeService(iframePath, portName, shadow);
    overlayIframeService.initOverlayIframe(initStyles);
  }
}

class AutofillOverlayIconIframe extends AutofillOverlayCustomElementIframe {
  constructor() {
    super("overlay/icon.html", AutofillOverlayPort.Icon, {
      background: "transparent",
      border: "none",
    });
  }
}

class AutofillOverlayListIframe extends AutofillOverlayCustomElementIframe {
  constructor() {
    super("overlay/list.html", AutofillOverlayPort.List, {
      height: "0",
      minWidth: "250px",
      maxHeight: "180px",
      boxShadow: "2px 4px 6px 0px rgba(0, 0, 0, 0.1)",
      borderRadius: "4px",
      border: "1px solid rgb(206, 212, 220)",
      backgroundColor: "#fff",
    });
  }
}

export { AutofillOverlayIconIframe, AutofillOverlayListIframe };

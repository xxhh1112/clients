import { AutofillOverlayPort } from "../utils/autofill-overlay.enum";

import OverlayIframeService from "./overlay-iframe.service";

class AutofillOverlayCustomElementIframe extends HTMLElement {
  constructor(iframePath: string, portName: string) {
    super();

    const shadow: ShadowRoot = this.attachShadow({ mode: "closed" });
    const overlayIframeService = new OverlayIframeService(iframePath, portName, shadow);
    overlayIframeService.initOverlayIframe();
  }
}

class AutofillOverlayIconIframe extends AutofillOverlayCustomElementIframe {
  constructor() {
    super("overlay/icon.html", AutofillOverlayPort.Icon);
  }
}

class AutofillOverlayListIframe extends AutofillOverlayCustomElementIframe {
  constructor() {
    super("overlay/list.html", AutofillOverlayPort.List);
  }
}

export { AutofillOverlayIconIframe, AutofillOverlayListIframe };

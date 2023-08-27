import AutofillOverlayIframeService from "./autofill-overlay-iframe.service";

class AutofillOverlayIframeElement extends HTMLElement {
  constructor(
    iframePath: string,
    portName: string,
    initStyles: Partial<CSSStyleDeclaration>,
    ariaAlert?: string
  ) {
    super();

    const shadow: ShadowRoot = this.attachShadow({ mode: "closed" });
    const autofillOverlayIframeService = new AutofillOverlayIframeService(
      iframePath,
      portName,
      shadow
    );
    autofillOverlayIframeService.initOverlayIframe(initStyles, ariaAlert);
  }
}

export default AutofillOverlayIframeElement;

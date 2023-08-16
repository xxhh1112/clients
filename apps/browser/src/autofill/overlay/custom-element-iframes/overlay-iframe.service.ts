class OverlayIframeService {
  private port: chrome.runtime.Port | null = null;
  private extensionOriginsSet: Set<string>;
  private readonly iframe: HTMLIFrameElement;
  private readonly iframeStyles: Partial<CSSStyleDeclaration> = {
    all: "initial",
    position: "fixed",
    display: "block",
    zIndex: "2147483647",
    lineHeight: "0",
    overflow: "hidden",
    transition: "opacity 125ms ease-out 0s",
    visibility: "visible",
    clipPath: "none",
    pointerEvents: "auto",
    margin: "0",
    padding: "0",
    colorScheme: "normal",
    opacity: "0",
  };

  constructor(private iframePath: string, private portName: string, private shadow: ShadowRoot) {
    this.iframe = globalThis.document.createElement("iframe");
    this.extensionOriginsSet = new Set([
      chrome.runtime.getURL("").slice(0, -1).toLowerCase(), // Remove the trailing slash and normalize the extension url to lowercase
      "null",
    ]);
  }

  initOverlayIframe(initStyles: Partial<CSSStyleDeclaration>) {
    this.iframe.src = chrome.runtime.getURL(this.iframePath);
    this.updateElementStyles(this.iframe, { ...this.iframeStyles, ...initStyles });
    this.iframe.setAttribute("sandbox", "allow-scripts");
    this.iframe.setAttribute("allowtransparency", "true");
    this.iframe.addEventListener("load", this.setupPortMessageListener);

    this.shadow.appendChild(this.iframe);
  }

  private setupPortMessageListener = () => {
    this.port = chrome.runtime.connect({ name: this.portName });
    this.port.onDisconnect.addListener(this.handlePortDisconnect);
    this.port.onMessage.addListener(this.handlePortMessage);
    globalThis.addEventListener("message", this.handleWindowMessage);
  };

  private handlePortDisconnect = (port: chrome.runtime.Port) => {
    if (port.name !== this.portName) {
      return;
    }

    this.updateElementStyles(this.iframe, { opacity: "0", height: "0" });
    globalThis.removeEventListener("message", this.handleWindowMessage);
    this.port.onMessage.removeListener(this.handlePortMessage);
    this.port.onDisconnect.removeListener(this.handlePortDisconnect);
    this.port.disconnect();
    this.port = null;
  };

  private handlePortMessage = (message: any, port: chrome.runtime.Port) => {
    if (port.name !== this.portName || !this.iframe.contentWindow) {
      return;
    }

    if (message.command === "updateIframePosition") {
      this.updateIframePosition(message.position);
      return;
    }

    if (message.command === "updateOverlayHidden") {
      this.updateElementStyles(this.iframe, { display: message.display });
      return;
    }

    this.iframe.contentWindow.postMessage(message, "*");
  };

  private updateIframePosition(position: Partial<CSSStyleDeclaration>) {
    this.updateElementStyles(this.iframe, position);
    setTimeout(() => this.updateElementStyles(this.iframe, { opacity: "1" }), 0);
  }

  private handleWindowMessage = (event: MessageEvent) => {
    if (
      !this.port ||
      event.source !== this.iframe.contentWindow ||
      !this.isFromExtensionOrigin(event.origin.toLowerCase())
    ) {
      return;
    }

    const message = event.data;
    if (message.command === "updateAutofillOverlayListHeight") {
      this.updateElementStyles(this.iframe, { height: `${message.height}px` });
      return;
    }

    this.port.postMessage(event.data);
  };

  private updateElementStyles(customElement: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
    if (!customElement) {
      return;
    }

    for (const styleProperty in styles) {
      customElement.style.setProperty(
        this.convertToKebabCase(styleProperty),
        styles[styleProperty],
        "important"
      );
    }
  }

  private convertToKebabCase(stringValue: string): string {
    return stringValue.replace(/([a-z])([A-Z])/g, "$1-$2");
  }

  /**
   * Chrome returns null for any sandboxed iframe sources.
   * Firefox references the extension URI as its origin.
   * Any other origin value is a security risk.
   * @param {string} messageOrigin
   * @returns {boolean}
   * @private
   */
  private isFromExtensionOrigin(messageOrigin: string): boolean {
    return this.extensionOriginsSet.has(messageOrigin);
  }
}

export default OverlayIframeService;

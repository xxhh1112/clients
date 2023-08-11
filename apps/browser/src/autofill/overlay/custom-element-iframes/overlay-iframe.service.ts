class OverlayIframeService {
  private port: chrome.runtime.Port | null = null;
  private extensionOriginsSet: Set<string>;
  private readonly iframe: HTMLIFrameElement;

  constructor(private iframePath: string, private portName: string, private shadow: ShadowRoot) {
    this.iframe = document.createElement("iframe");
    this.extensionOriginsSet = new Set([
      // Remove the trailing slash and normalize the extension url to lowercase
      chrome.runtime.getURL("").slice(0, -1).toLowerCase(),
      "null",
    ]);
  }

  initOverlayIframe() {
    this.iframe.src = chrome.runtime.getURL(this.iframePath);
    this.iframe.style.border = "none";
    this.iframe.style.background = "transparent";
    this.iframe.style.margin = "0";
    this.iframe.style.padding = "0";
    this.iframe.style.width = "100%";
    this.iframe.style.height = "100%";
    this.iframe.setAttribute("sandbox", "allow-scripts");
    this.iframe.addEventListener("load", this.setupPortMessageListener);

    this.shadow.appendChild(this.iframe);
  }

  private setupPortMessageListener = () => {
    this.port = chrome.runtime.connect({ name: this.portName });
    this.port.onDisconnect.addListener(this.handlePortDisconnect);
    this.port.onMessage.addListener(this.handlePortMessage);
    window.addEventListener("message", this.handleWindowMessage);
  };

  private handlePortDisconnect = (port: chrome.runtime.Port) => {
    if (port.name !== this.portName) {
      return;
    }

    window.removeEventListener("message", this.handleWindowMessage);
    this.port.onMessage.removeListener(this.handlePortMessage);
    this.port.onDisconnect.removeListener(this.handlePortDisconnect);
    this.port.disconnect();
    this.port = null;
  };

  private handlePortMessage = (message: any, port: chrome.runtime.Port) => {
    if (port.name !== this.portName || !this.iframe.contentWindow) {
      return;
    }

    this.iframe.contentWindow.postMessage(message, "*");
  };

  private handleWindowMessage = (event: MessageEvent) => {
    if (
      !this.port ||
      event.source !== this.iframe.contentWindow ||
      !this.isFromExtensionOrigin(event.origin.toLowerCase())
    ) {
      return;
    }

    this.port.postMessage(event.data);
  };

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

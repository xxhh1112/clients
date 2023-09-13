import { EVENTS } from "../../../constants";
import { RedirectFocusDirection } from "../../../utils/autofill-overlay.enum";
import {
  AutofillOverlayPageElementWindowMessage,
  WindowMessageHandlers,
} from "../../abstractions/autofill-overlay-page-element";

class AutofillOverlayPageElement extends HTMLElement {
  protected shadowDom: ShadowRoot;
  protected messageOrigin: string;
  protected translations: Record<string, string>;
  protected windowMessageHandlers: WindowMessageHandlers;

  constructor() {
    super();

    this.shadowDom = this.attachShadow({ mode: "closed" });
  }

  protected initOverlayPage(
    elementName: "button" | "list",
    styleSheetUrl: string,
    translations: Record<string, string>
  ): HTMLLinkElement {
    this.translations = translations;
    globalThis.document.documentElement.setAttribute("lang", this.getTranslation("locale"));
    globalThis.document.head.title = this.getTranslation(`${elementName}PageTitle`);

    this.shadowDom.innerHTML = "";
    const linkElement = globalThis.document.createElement("link");
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("href", styleSheetUrl);

    return linkElement;
  }

  protected postMessageToParent(message: AutofillOverlayPageElementWindowMessage) {
    if (!this.messageOrigin) {
      return;
    }

    globalThis.parent.postMessage(message, this.messageOrigin);
  }

  protected getTranslation(key: string): string {
    return this.translations[key] || "";
  }

  protected setupGlobalListeners(windowMessageHandlers: WindowMessageHandlers) {
    this.windowMessageHandlers = windowMessageHandlers;

    globalThis.addEventListener(EVENTS.MESSAGE, this.handleWindowMessage);
    globalThis.addEventListener(EVENTS.BLUR, this.handleWindowBlurEvent);
    globalThis.document.addEventListener(EVENTS.KEYDOWN, this.handleDocumentKeyDownEvent);
  }

  private handleWindowMessage = (event: MessageEvent) => {
    if (!this.windowMessageHandlers) {
      return;
    }

    if (!this.messageOrigin) {
      this.messageOrigin = event.origin;
    }

    const message = event?.data;
    const handler = this.windowMessageHandlers[message?.command];
    if (!handler) {
      return;
    }

    handler({ message });
  };

  private handleWindowBlurEvent = () => {
    this.postMessageToParent({ command: "overlayPageBlurred" });
  };

  private handleDocumentKeyDownEvent = (event: KeyboardEvent) => {
    const listenedForKeys = new Set(["Tab", "Escape"]);
    if (!listenedForKeys.has(event.key)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (event.key === "Tab") {
      this.redirectOverlayFocusOutMessage(
        event.shiftKey ? RedirectFocusDirection.Previous : RedirectFocusDirection.Next
      );
      return;
    }

    this.redirectOverlayFocusOutMessage(RedirectFocusDirection.Current);
  };

  private redirectOverlayFocusOutMessage(direction: string) {
    this.postMessageToParent({ command: "redirectOverlayFocusOut", direction });
  }
}

export default AutofillOverlayPageElement;

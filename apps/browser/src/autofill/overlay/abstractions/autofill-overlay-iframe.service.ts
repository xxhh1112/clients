type BackgroundPortMessageHandlers = {
  [key: string]: CallableFunction;
  updateIframePosition: ({ message }: { message: any }) => void;
  updateOverlayHidden: ({ message }: { message: any }) => void;
};

interface AutofillOverlayIframeService {
  initOverlayIframe(initStyles: Partial<CSSStyleDeclaration>, ariaAlert?: string): void;
}

export { BackgroundPortMessageHandlers, AutofillOverlayIframeService };

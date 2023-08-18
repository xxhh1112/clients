function buildSvgDomElement(svgString: string): HTMLElement {
  const domParser = new DOMParser();
  const svgDom = domParser.parseFromString(svgString, "image/svg+xml");
  return svgDom.documentElement;
}

function sendExtensionMessage(command: string, options: any = {}) {
  chrome.runtime.sendMessage(Object.assign({ command }, options));
}

function setElementStyles(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>,
  priority?: "important" | ""
) {
  if (!element) {
    return;
  }

  for (const styleProperty in styles) {
    element.style.setProperty(
      styleProperty.replace(/([a-z])([A-Z])/g, "$1-$2"), // Convert camelCase to kebab-case
      styles[styleProperty],
      priority
    );
  }
}

export { buildSvgDomElement, sendExtensionMessage, setElementStyles };

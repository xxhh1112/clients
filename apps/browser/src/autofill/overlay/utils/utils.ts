function buildSvgDomElement(svgString: string, ariaHidden: "true" | "false" = "true"): HTMLElement {
  const domParser = new DOMParser();
  const svgDom = domParser.parseFromString(svgString, "image/svg+xml");
  const domElement = svgDom.documentElement;
  domElement.setAttribute("aria-hidden", ariaHidden);

  return domElement;
}

function sendExtensionMessage(command: string, options: Record<string, any> = {}) {
  chrome.runtime.sendMessage(Object.assign({ command }, options));
}

function setElementStyles(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>,
  priority: "important" | "" = ""
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

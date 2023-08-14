function buildSvgDomElement(svgString: string): HTMLElement {
  const domParser = new DOMParser();
  const svgDom = domParser.parseFromString(svgString, "image/svg+xml");
  return svgDom.documentElement;
}

function sendExtensionMessage(command: string, options: any = {}) {
  chrome.runtime.sendMessage(Object.assign({ command }, options));
}

export { buildSvgDomElement, sendExtensionMessage };

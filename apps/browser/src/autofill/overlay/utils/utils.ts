function buildSvgDomElement(svgString: string): HTMLElement {
  const domParser = new DOMParser();
  const svgDom = domParser.parseFromString(svgString, "image/svg+xml");
  return svgDom.documentElement;
}

export { buildSvgDomElement };

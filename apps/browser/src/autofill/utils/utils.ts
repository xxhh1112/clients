function generateRandomChars(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const randomChars = [];
  const randomBytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(randomBytes);

  for (const byte of randomBytes) {
    randomChars.push(chars[byte % chars.length]);
  }

  return randomChars.join("");
}

function generateRandomCustomElementName(): string {
  const length = Math.floor(Math.random() * 5) + 8; // Between 8 and 12 characters
  const numHyphens = Math.min(Math.max(Math.floor(Math.random() * 4), 1), length - 1); // At least 1, maximum of 3 hyphens

  const hyphenIndices: number[] = [];
  while (hyphenIndices.length < numHyphens) {
    const index = Math.floor(Math.random() * (length - 1)) + 1;
    if (!hyphenIndices.includes(index)) {
      hyphenIndices.push(index);
    }
  }
  hyphenIndices.sort((a, b) => a - b);

  let randomString = "";
  let prevIndex = 0;

  for (const index of hyphenIndices) {
    randomString = randomString + generateRandomChars(index - prevIndex) + "-";
    prevIndex = index;
  }

  randomString += generateRandomChars(length - prevIndex);

  return randomString;
}

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

export {
  generateRandomCustomElementName,
  buildSvgDomElement,
  sendExtensionMessage,
  setElementStyles,
};

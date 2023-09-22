let mutationObserver: MutationObserver;
let exportData: string;
let importStarted = false;
let importCancelled = false;

// PM-4032 - Detect LastPass Export Page and Suppress Download Prompt
overrideAppendChild();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadImporter);
} else {
  loadImporter();
}

function overrideAppendChild() {
  const script = document.createElement("script");
  script.textContent = `
    let href = '';
    let download = '';
    const defaultAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function (newChild) {
      if (newChild.nodeName.toLowerCase() === 'a' && newChild.download) {
        download = newChild.download;
        href = newChild.href;
        newChild.setAttribute('href', 'javascript:void(0)');
        newChild.setAttribute('download', '');

        Element.prototype.appendChild = defaultAppendChild;
      }

      return defaultAppendChild.call(this, newChild);
    };

    window.addEventListener('message', (event) => {
      if (event.source !== window) {
        return;
      }

      const command = event.data?.command;
      if (command !== 'cancelLpImport') {
        return;
      }

      const anchor = document.createElement('a');
      anchor.setAttribute('href', href);
      anchor.setAttribute('download', download);
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    });
  `;
  document.documentElement.appendChild(script);
}

function loadImporter() {
  mutationObserver = new MutationObserver(handleMutation);
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function handleMutation(mutations: MutationRecord[]) {
  if (!mutations?.length) {
    return;
  }

  for (let index = 0; index < mutations.length; index++) {
    const mutation: MutationRecord = mutations[index];
    if (!mutation.addedNodes?.length) {
      continue;
    }

    for (let index = 0; index < mutation.addedNodes.length; index++) {
      const addedNode: Node = mutation.addedNodes[index];

      const tagName: string = addedNode.nodeName.toLowerCase();
      if (tagName !== "pre") {
        continue;
      }

      const preElement: HTMLPreElement = addedNode as HTMLPreElement;
      if (!preElement.innerText) {
        continue;
      }

      const innerText: string = preElement.innerText.trim();
      if (!innerText) {
        continue;
      }

      exportData = innerText;
      displayImportPrompt();
      mutationObserver.disconnect();
    }
  }
}

// PM-4033 - Display Import Prompt to User
function displayImportPrompt() {
  if (!exportData) {
    return;
  }

  chrome.runtime.sendMessage({ command: "bgRequestLastPassImport" });
  chrome.runtime.onMessage.addListener((msg) => {
    const command = msg?.command;
    if (command === "startLpImport" && exportData) {
      chrome.runtime.sendMessage({
        command: "startLpImport",
        data: exportData,
      });
      importStarted = true;
      return;
    }

    if (command === "cancelLpImport" || (!importStarted && command === "closeNotificationBar")) {
      if (importCancelled) {
        return;
      }

      importCancelled = true;
      window.postMessage({ command: "cancelLpImport" }, window.location.origin);
    }
  });
}

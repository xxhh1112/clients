// eslint-disable-next-line no-console
console.log("content-script loaded");

const s = document.createElement("script");
s.src = chrome.runtime.getURL("content/webauthn/page-script.js");
(document.head || document.documentElement).appendChild(s);

import { MessageType } from "./messaging/message";
import { Messenger } from "./messaging/messenger";

// eslint-disable-next-line no-console
console.log("content-script loaded");

const s = document.createElement("script");
s.src = chrome.runtime.getURL("content/webauthn/page-script.js");
(document.head || document.documentElement).appendChild(s);

const messenger = Messenger.createInExtensionContext(window, chrome.runtime.connect());

messenger.addHandler(async (message) => {
  if (message.type === MessageType.CredentialCreationRequest) {
    chrome.runtime.sendMessage({
      command: "fido2RegisterCredentialRequest",
      data: message.data,
    });

    return {
      type: MessageType.CredentialCreationResponse,
      approved: true,
    };
  }

  return undefined;
});

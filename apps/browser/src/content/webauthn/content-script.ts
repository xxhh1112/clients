import { MessageType } from "./messaging/message";
import { Messenger } from "./messaging/messenger";

// eslint-disable-next-line no-console
console.log("content-script loaded");

const s = document.createElement("script");
s.src = chrome.runtime.getURL("content/webauthn/page-script.js");
(document.head || document.documentElement).appendChild(s);

const messenger = Messenger.forDOMCommunication(window);

messenger.addHandler(async (message) => {
  if (message.type === MessageType.CredentialCreationRequest) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          command: "fido2RegisterCredentialRequest",
          data: message.data,
        },
        (response) => {
          resolve({
            type: MessageType.CredentialCreationResponse,
            approved: true,
            result: response,
          });
        }
      );
    });
  }

  return undefined;
});

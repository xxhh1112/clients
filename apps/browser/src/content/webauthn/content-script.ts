import { Message, MessageType } from "./messaging/message";
import { Messenger } from "./messaging/messenger";

const s = document.createElement("script");
s.src = chrome.runtime.getURL("content/webauthn/page-script.js");
(document.head || document.documentElement).appendChild(s);

const messenger = Messenger.forDOMCommunication(window);

messenger.handler = async (message, abortController) => {
  const abortHandler = () =>
    chrome.runtime.sendMessage({
      command: "fido2AbortRequest",
      abortedRequestId: message.metadata.requestId,
    });
  abortController.signal.addEventListener("abort", abortHandler);

  if (message.type === MessageType.CredentialCreationRequest) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          command: "fido2RegisterCredentialRequest",
          data: message.data,
          requestId: message.metadata.requestId,
        },
        (response) => {
          if (response.error !== undefined) {
            return reject(response.error);
          }

          resolve({
            type: MessageType.CredentialCreationResponse,
            result: response.result,
          });
        }
      );
    });
  }

  if (message.type === MessageType.CredentialGetRequest) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          command: "fido2GetCredentialRequest",
          data: message.data,
          requestId: message.metadata.requestId,
        },
        (response) => {
          if (response.error !== undefined) {
            return reject(response.error);
          }

          resolve({
            type: MessageType.CredentialGetResponse,
            result: response.result,
          });
        }
      );
    }).finally(() =>
      abortController.signal.removeEventListener("abort", abortHandler)
    ) as Promise<Message>;
  }

  return undefined;
};

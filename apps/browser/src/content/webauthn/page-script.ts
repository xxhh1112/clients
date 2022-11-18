import { MessageType } from "./messaging/message";
import { Messenger } from "./messaging/messenger";

// eslint-disable-next-line no-console
console.log("page-script loaded");

const browserCredentials = {
  create: navigator.credentials.create.bind(navigator.credentials),
  get: navigator.credentials.get.bind(navigator.credentials),
};

const messenger = Messenger.forDOMCommunication(window);

navigator.credentials.create = async (options?: CredentialCreationOptions): Promise<Credential> => {
  await messenger.request({
    type: MessageType.CredentialCreationRequest,
    data: {
      rp: {
        id: options.publicKey.rp.id,
      },
    },
  });

  return await browserCredentials.create(options);
};

navigator.credentials.get = async (options?: CredentialRequestOptions): Promise<Credential> => {
  return await browserCredentials.get(options);
};

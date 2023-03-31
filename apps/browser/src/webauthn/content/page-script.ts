import { WebauthnUtils } from "../../browser/webauthn-utils";

import { MessageType } from "./messaging/message";
import { Messenger } from "./messaging/messenger";

const browserCredentials = {
  create: navigator.credentials.create.bind(navigator.credentials),
  get: navigator.credentials.get.bind(navigator.credentials),
};

const messenger = Messenger.forDOMCommunication(window);

navigator.credentials.create = async (
  options?: CredentialCreationOptions,
  abortController?: AbortController
): Promise<Credential> => {
  if (options.publicKey?.authenticatorSelection?.authenticatorAttachment === "platform") {
    return await browserCredentials.create(options);
  }

  try {
    const response = await messenger.request(
      {
        type: MessageType.CredentialCreationRequest,
        // TODO: Fix sameOriginWithAncestors!
        data: WebauthnUtils.mapCredentialCreationOptions(options, window.location.origin, true),
      },
      abortController
    );

    if (response.type !== MessageType.CredentialCreationResponse) {
      throw new Error("Something went wrong.");
    }

    console.log(response.result);

    let mappedResult;
    try {
      mappedResult = WebauthnUtils.mapCredentialRegistrationResult(response.result);
    } catch (e) {
      console.error(e);
      throw e;
    }

    console.log(mappedResult);

    return mappedResult;
  } catch (error) {
    if (error && error.fallbackRequested) {
      return await browserCredentials.create(options);
    }

    throw error;
  }
};

navigator.credentials.get = async (
  options?: CredentialRequestOptions,
  abortController?: AbortController
): Promise<Credential> => {
  try {
    const response = await messenger.request(
      {
        type: MessageType.CredentialGetRequest,
        // TODO: Fix sameOriginWithAncestors!
        data: WebauthnUtils.mapCredentialRequestOptions(options, window.location.origin, true),
      },
      abortController
    );

    if (response.type !== MessageType.CredentialGetResponse) {
      throw new Error("Something went wrong.");
    }

    console.log(response.result);

    return WebauthnUtils.mapCredentialAssertResult(response.result);
  } catch (error) {
    if (error && error.fallbackRequested) {
      return await browserCredentials.get(options);
    }

    throw error;
  }
};

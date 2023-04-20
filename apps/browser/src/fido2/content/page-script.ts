import { WebauthnUtils } from "../../browser/webauthn-utils";

import { MessageType } from "./messaging/message";
import { Messenger } from "./messaging/messenger";

const browserCredentials = {
  create: navigator.credentials.create.bind(
    navigator.credentials
  ) as typeof navigator.credentials.create,
  get: navigator.credentials.get.bind(navigator.credentials) as typeof navigator.credentials.get,
};

const messenger = Messenger.forDOMCommunication(window);

navigator.credentials.create = async (
  options?: CredentialCreationOptions,
  abortController?: AbortController
): Promise<Credential> => {
  // if (options.publicKey?.authenticatorSelection?.authenticatorAttachment === "platform") {
  //   return await browserCredentials.create(options);
  // }

  console.log("navigator.credentials.create", options.publicKey);

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
      const browserResponse = await browserCredentials.create(options);
      console.log("browserResponse", browserResponse);
      return browserResponse;
    }

    throw error;
  }
};

navigator.credentials.get = async (
  options?: CredentialRequestOptions,
  abortController?: AbortController
): Promise<Credential> => {
  console.log("navigator.credentials.get()", options);

  try {
    const response = await messenger.request(
      {
        type: MessageType.CredentialGetRequest,
        // TODO: Fix sameOriginWithAncestors!
        data: WebauthnUtils.mapCredentialRequestOptions(options, window.location.origin, true),
      },
      abortController
    );

    console.log("Response from background", response);

    if (response.type !== MessageType.CredentialGetResponse) {
      throw new Error("Something went wrong.");
    }

    return WebauthnUtils.mapCredentialAssertResult(response.result);
  } catch (error) {
    console.log("Error from background", error);
    if (error && error.fallbackRequested) {
      const browserResponse = await browserCredentials.get(options);
      console.log("browserResponse", browserResponse);
      return browserResponse;
    }

    throw error;
  }
};

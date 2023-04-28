import { WebauthnUtils } from "../../browser/webauthn-utils";

import { MessageType } from "./messaging/message";
import { Messenger } from "./messaging/messenger";

const browserNativeWebauthnSupport = window.PublicKeyCredential == undefined;
if (!browserNativeWebauthnSupport) {
  // Polyfill webauthn in browser without support
  try {
    // credentials is read-only if supported, use type-casting to force assignment
    (navigator as any).credentials = {
      async create() {
        throw new Error("Webauthn not supported in this browser.");
      },
      async get() {
        throw new Error("Webauthn not supported in this browser.");
      },
    };
    // We will be replacing this class with our own implementation when responding
    window.PublicKeyCredential = class {} as any;
  } catch {
    /* empty */
  }
}
window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = async () => true;

const browserCredentials = {
  create: navigator.credentials.create.bind(
    navigator.credentials
  ) as typeof navigator.credentials.create,
  get: navigator.credentials.get.bind(navigator.credentials) as typeof navigator.credentials.get,
  isUserVerifyingPlatformAuthenticatorAvailable:
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable,
};

const messenger = Messenger.forDOMCommunication(window);

navigator.credentials.create = async (
  options?: CredentialCreationOptions,
  abortController?: AbortController
): Promise<Credential> => {
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

    return WebauthnUtils.mapCredentialRegistrationResult(response.result);
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

    return WebauthnUtils.mapCredentialAssertResult(response.result);
  } catch (error) {
    if (error && error.fallbackRequested) {
      return await browserCredentials.get(options);
    }

    throw error;
  }
};

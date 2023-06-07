import { WebauthnUtils } from "../../../browser/webauthn-utils";

import { MessageType } from "./messaging/message";
import { Messenger } from "./messaging/messenger";

const BrowserPublicKeyCredential = window.PublicKeyCredential;

const browserNativeWebauthnSupport = window.PublicKeyCredential != undefined;
let browserNativeWebauthnPlatformAuthenticatorSupport = false;
if (!browserNativeWebauthnSupport) {
  // Polyfill webauthn support
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
    window.PublicKeyCredential = class PolyfillPublicKeyCredential {
      static isUserVerifyingPlatformAuthenticatorAvailable() {
        return Promise.resolve(true);
      }
    } as any;
    window.AuthenticatorAttestationResponse =
      class PolyfillAuthenticatorAttestationResponse {} as any;
  } catch {
    /* empty */
  }
}

if (browserNativeWebauthnSupport) {
  BrowserPublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then((available) => {
    browserNativeWebauthnPlatformAuthenticatorSupport = available;

    if (!available) {
      // Polyfill platform authenticator support
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = () =>
        Promise.resolve(true);
    }
  });
}

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
  const fallbackSupported =
    (options?.publicKey?.authenticatorSelection.authenticatorAttachment === "platform" &&
      browserNativeWebauthnPlatformAuthenticatorSupport) ||
    (options?.publicKey?.authenticatorSelection.authenticatorAttachment !== "platform" &&
      browserNativeWebauthnSupport);
  try {
    const response = await messenger.request(
      {
        type: MessageType.CredentialCreationRequest,
        // TODO: Fix sameOriginWithAncestors!
        data: WebauthnUtils.mapCredentialCreationOptions(
          options,
          window.location.origin,
          true,
          fallbackSupported
        ),
      },
      abortController
    );

    if (response.type !== MessageType.CredentialCreationResponse) {
      throw new Error("Something went wrong.");
    }

    return WebauthnUtils.mapCredentialRegistrationResult(response.result);
  } catch (error) {
    if (error && error.fallbackRequested && fallbackSupported) {
      return await browserCredentials.create(options);
    }

    throw error;
  }
};

navigator.credentials.get = async (
  options?: CredentialRequestOptions,
  abortController?: AbortController
): Promise<Credential> => {
  const fallbackSupported = browserNativeWebauthnSupport;
  try {
    const response = await messenger.request(
      {
        type: MessageType.CredentialGetRequest,
        // TODO: Fix sameOriginWithAncestors!
        data: WebauthnUtils.mapCredentialRequestOptions(
          options,
          window.location.origin,
          true,
          fallbackSupported
        ),
      },
      abortController
    );

    if (response.type !== MessageType.CredentialGetResponse) {
      throw new Error("Something went wrong.");
    }

    return WebauthnUtils.mapCredentialAssertResult(response.result);
  } catch (error) {
    if (error && error.fallbackRequested && fallbackSupported) {
      return await browserCredentials.get(options);
    }

    throw error;
  }
};

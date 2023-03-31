import { parse } from "tldts";

import { Utils } from "../../misc/utils";
import {
  Fido2AutenticatorError,
  Fido2AutenticatorErrorCode,
  Fido2AuthenticatorGetAssertionParams,
  Fido2AuthenticatorMakeCredentialsParams,
  Fido2AuthenticatorService,
  PublicKeyCredentialDescriptor,
} from "../abstractions/fido2-authenticator.service.abstraction";
import {
  AssertCredentialParams,
  AssertCredentialResult,
  CreateCredentialParams,
  CreateCredentialResult,
  Fido2ClientService as Fido2ClientServiceAbstraction,
  PublicKeyCredentialParam,
  UserVerification,
} from "../abstractions/fido2-client.service.abstraction";
import { Fido2Utils } from "../abstractions/fido2-utils";

export class Fido2ClientService implements Fido2ClientServiceAbstraction {
  constructor(private authenticator: Fido2AuthenticatorService) {}

  async createCredential(
    params: CreateCredentialParams,
    abortController = new AbortController()
  ): Promise<CreateCredentialResult> {
    if (!params.sameOriginWithAncestors) {
      throw new DOMException("Invalid 'sameOriginWithAncestors' value", "NotAllowedError");
    }

    const userId = Fido2Utils.stringToBuffer(params.user.id);
    if (userId.length < 1 || userId.length > 64) {
      throw new TypeError("Invalid 'user.id' length");
    }

    const { domain: effectiveDomain } = parse(params.origin, { allowPrivateDomains: true });
    if (effectiveDomain == undefined) {
      throw new DOMException("'origin' is not a valid domain", "SecurityError");
    }

    const rpId = params.rp.id ?? effectiveDomain;
    if (effectiveDomain !== rpId) {
      throw new DOMException("'rp.id' does not match origin effective domain", "SecurityError");
    }

    let credTypesAndPubKeyAlgs: PublicKeyCredentialParam[];
    if (params.pubKeyCredParams?.length > 0) {
      credTypesAndPubKeyAlgs = params.pubKeyCredParams.filter(
        (kp) => kp.alg === -7 && kp.type === "public-key"
      );
    } else {
      credTypesAndPubKeyAlgs = [
        { alg: -7, type: "public-key" },
        { alg: -257, type: "public-key" },
      ];
    }

    if (credTypesAndPubKeyAlgs.length === 0) {
      throw new DOMException("No supported key algorithms were found", "NotSupportedError");
    }

    const collectedClientData = {
      type: "webauthn.create",
      challenge: params.challenge,
      origin: params.origin,
      crossOrigin: !params.sameOriginWithAncestors,
      // tokenBinding: {} // Not currently supported
    };
    const clientDataJSON = JSON.stringify(collectedClientData);
    const clientDataJSONBytes = Utils.fromByteStringToArray(clientDataJSON);
    const clientDataHash = await crypto.subtle.digest({ name: "SHA-256" }, clientDataJSONBytes);

    if (abortController.signal.aborted) {
      throw new DOMException(undefined, "AbortError");
    }

    const timeout = setAbortTimeout(
      abortController,
      params.authenticatorSelection?.userVerification,
      params.timeout
    );

    const excludeCredentialDescriptorList: PublicKeyCredentialDescriptor[] = [];

    if (params.excludeCredentials !== undefined) {
      for (const credential of params.excludeCredentials) {
        try {
          excludeCredentialDescriptorList.push({
            id: Fido2Utils.stringToBuffer(credential.id),
            transports: credential.transports,
            type: credential.type,
          });
          // eslint-disable-next-line no-empty
        } catch {}
      }
    }

    const makeCredentialParams: Fido2AuthenticatorMakeCredentialsParams = {
      requireResidentKey:
        params.authenticatorSelection?.residentKey === "required" ||
        (params.authenticatorSelection?.residentKey === undefined &&
          params.authenticatorSelection?.requireResidentKey === true),
      requireUserVerification: params.authenticatorSelection?.userVerification === "required",
      enterpriseAttestationPossible: params.attestation === "enterprise",
      excludeCredentialDescriptorList,
      credTypesAndPubKeyAlgs,
      hash: clientDataHash,
      rpEntity: {
        id: rpId,
        name: params.rp.name,
      },
      userEntity: {
        id: Fido2Utils.stringToBuffer(params.user.id),
        displayName: params.user.displayName,
      },
    };

    let makeCredentialResult;
    try {
      makeCredentialResult = await this.authenticator.makeCredential(
        makeCredentialParams,
        abortController
      );
    } catch (error) {
      if (
        error instanceof Fido2AutenticatorError &&
        error.errorCode === Fido2AutenticatorErrorCode.InvalidState
      ) {
        throw new DOMException(undefined, "InvalidStateError");
      }
      throw new DOMException(undefined, "NotAllowedError");
    }

    if (abortController.signal.aborted) {
      throw new DOMException(undefined, "AbortError");
    }
    clearTimeout(timeout);

    return {
      credentialId: Fido2Utils.bufferToString(makeCredentialResult.credentialId),
      attestationObject: Fido2Utils.bufferToString(makeCredentialResult.attestationObject),
      authData: Fido2Utils.bufferToString(makeCredentialResult.authData),
      publicKeyAlgorithm: makeCredentialResult.publicKeyAlgorithm,
      clientDataJSON,
      transports: ["web-extension"],
    };
  }

  async assertCredential(
    params: AssertCredentialParams,
    abortController = new AbortController()
  ): Promise<AssertCredentialResult> {
    const { domain: effectiveDomain } = parse(params.origin, { allowPrivateDomains: true });
    if (effectiveDomain == undefined) {
      throw new DOMException("'origin' is not a valid domain", "SecurityError");
    }

    const rpId = params.rpId ?? effectiveDomain;
    if (effectiveDomain !== rpId) {
      throw new DOMException("'rp.id' does not match origin effective domain", "SecurityError");
    }

    const collectedClientData = {
      type: "webauthn.create",
      challenge: params.challenge,
      origin: params.origin,
      crossOrigin: !params.sameOriginWithAncestors,
      // tokenBinding: {} // Not currently supported
    };
    const clientDataJSON = JSON.stringify(collectedClientData);
    const clientDataJSONBytes = Utils.fromByteStringToArray(clientDataJSON);
    const clientDataHash = await crypto.subtle.digest({ name: "SHA-256" }, clientDataJSONBytes);

    if (abortController.signal.aborted) {
      throw new DOMException(undefined, "AbortError");
    }

    const timeout = setAbortTimeout(abortController, params.userVerification, params.timeout);

    const allowCredentialDescriptorList: PublicKeyCredentialDescriptor[] = [];
    for (const id of params.allowedCredentialIds) {
      try {
        allowCredentialDescriptorList.push({
          id: Utils.guidToRawFormat(id),
          type: "public-key",
        });
        // eslint-disable-next-line no-empty
      } catch {}
    }

    const getAssertionParams: Fido2AuthenticatorGetAssertionParams = {
      rpId,
      requireUserVerification: params.userVerification === "required",
      hash: clientDataHash,
      allowCredentialDescriptorList,
      extensions: {},
    };

    let getAssertionResult;
    try {
      getAssertionResult = await this.authenticator.getAssertion(
        getAssertionParams,
        abortController
      );
    } catch (error) {
      if (
        error instanceof Fido2AutenticatorError &&
        error.errorCode === Fido2AutenticatorErrorCode.InvalidState
      ) {
        throw new DOMException(undefined, "InvalidStateError");
      }
      throw new DOMException(undefined, "NotAllowedError");
    }

    if (abortController.signal.aborted) {
      throw new DOMException(undefined, "AbortError");
    }
    clearTimeout(timeout);

    return {
      authenticatorData: Fido2Utils.bufferToString(getAssertionResult.authenticatorData),
      clientDataJSON,
      credentialId: getAssertionResult.selectedCredential.id,
      userHandle:
        getAssertionResult.selectedCredential.userHandle !== undefined
          ? Fido2Utils.bufferToString(getAssertionResult.selectedCredential.userHandle)
          : undefined,
      signature: Fido2Utils.bufferToString(getAssertionResult.signature),
    };
  }
}

const TIMEOUTS = {
  NO_VERIFICATION: {
    DEFAULT: 120000,
    MIN: 30000,
    MAX: 180000,
  },
  WITH_VERIFICATION: {
    DEFAULT: 300000,
    MIN: 30000,
    MAX: 600000,
  },
};

function setAbortTimeout(
  abortController: AbortController,
  userVerification?: UserVerification,
  timeout?: number
): number {
  let clampedTimeout: number;

  if (userVerification === "required") {
    timeout = timeout ?? TIMEOUTS.WITH_VERIFICATION.DEFAULT;
    clampedTimeout = Math.max(
      TIMEOUTS.WITH_VERIFICATION.MIN,
      Math.min(timeout, TIMEOUTS.WITH_VERIFICATION.MAX)
    );
  } else {
    timeout = timeout ?? TIMEOUTS.NO_VERIFICATION.DEFAULT;
    clampedTimeout = Math.max(
      TIMEOUTS.NO_VERIFICATION.MIN,
      Math.min(timeout, TIMEOUTS.NO_VERIFICATION.MAX)
    );
  }

  return window.setTimeout(() => abortController.abort(), clampedTimeout);
}

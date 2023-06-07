import { parse } from "tldts";

import { ConfigServiceAbstraction } from "../../../abstractions/config/config.service.abstraction";
import { LogService } from "../../../abstractions/log.service";
import { FeatureFlag } from "../../../enums/feature-flag.enum";
import { Utils } from "../../../misc/utils";
import {
  Fido2AutenticatorError,
  Fido2AutenticatorErrorCode,
  Fido2AuthenticatorGetAssertionParams,
  Fido2AuthenticatorMakeCredentialsParams,
  Fido2AuthenticatorService,
  PublicKeyCredentialDescriptor,
} from "../../abstractions/fido2/fido2-authenticator.service.abstraction";
import {
  AssertCredentialParams,
  AssertCredentialResult,
  CreateCredentialParams,
  CreateCredentialResult,
  FallbackRequestedError,
  Fido2ClientService as Fido2ClientServiceAbstraction,
  PublicKeyCredentialParam,
  UserRequestedFallbackAbortReason,
  UserVerification,
} from "../../abstractions/fido2/fido2-client.service.abstraction";

import { isValidRpId } from "./domain-utils";
import { Fido2Utils } from "./fido2-utils";

export class Fido2ClientService implements Fido2ClientServiceAbstraction {
  constructor(
    private authenticator: Fido2AuthenticatorService,
    private configService: ConfigServiceAbstraction,
    private logService?: LogService
  ) {}

  async createCredential(
    params: CreateCredentialParams,
    abortController = new AbortController()
  ): Promise<CreateCredentialResult> {
    const enableFido2VaultCredentials = await this.configService.getFeatureFlagBool(
      FeatureFlag.Fido2VaultCredentials
    );

    if (!enableFido2VaultCredentials) {
      this.logService?.warning(`[Fido2Client] Fido2VaultCredential is not enabled`);
      throw new FallbackRequestedError();
    }

    if (!params.sameOriginWithAncestors) {
      this.logService?.warning(
        `[Fido2Client] Invalid 'sameOriginWithAncestors' value: ${params.sameOriginWithAncestors}`
      );
      throw new DOMException("Invalid 'sameOriginWithAncestors' value", "NotAllowedError");
    }

    const userId = Fido2Utils.stringToBuffer(params.user.id);
    if (userId.length < 1 || userId.length > 64) {
      this.logService?.warning(
        `[Fido2Client] Invalid 'user.id' length: ${params.user.id} (${userId.length})`
      );
      throw new TypeError("Invalid 'user.id' length");
    }

    const parsedOrigin = parse(params.origin, { allowPrivateDomains: true });
    const rpId = params.rp.id ?? parsedOrigin.hostname;

    if (parsedOrigin.hostname == undefined || !params.origin.startsWith("https://")) {
      this.logService?.warning(`[Fido2Client] Invalid https origin: ${params.origin}`);
      throw new DOMException("'origin' is not a valid https origin", "SecurityError");
    }

    if (!isValidRpId(rpId, params.origin)) {
      this.logService?.warning(
        `[Fido2Client] 'rp.id' cannot be used with the current origin: rp.id = ${rpId}; origin = ${params.origin}`
      );
      throw new DOMException("'rp.id' cannot be used with the current origin", "SecurityError");
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
      const requestedAlgorithms = credTypesAndPubKeyAlgs.map((p) => p.alg).join(", ");
      this.logService?.warning(
        `[Fido2Client] No compatible algorithms found, RP requested: ${requestedAlgorithms}`
      );
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
      this.logService?.info(`[Fido2Client] Aborted with AbortController`);
      throw new DOMException(undefined, "AbortError");
    }
    const timeout = setAbortTimeout(
      abortController,
      params.authenticatorSelection?.userVerification,
      params.timeout
    );
    const excludeCredentialDescriptorList: PublicKeyCredentialDescriptor[] =
      params.excludeCredentials?.map((credential) => ({
        id: Fido2Utils.stringToBuffer(credential.id),
        transports: credential.transports,
        type: credential.type,
      })) ?? [];

    const makeCredentialParams: Fido2AuthenticatorMakeCredentialsParams = {
      requireResidentKey:
        params.authenticatorSelection?.residentKey === "required" ||
        params.authenticatorSelection?.residentKey === "preferred" ||
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
      fallbackSupported: params.fallbackSupported,
    };
    let makeCredentialResult;
    try {
      makeCredentialResult = await this.authenticator.makeCredential(
        makeCredentialParams,
        abortController
      );
    } catch (error) {
      if (
        abortController.signal.aborted &&
        abortController.signal.reason === UserRequestedFallbackAbortReason
      ) {
        this.logService?.info(`[Fido2Client] Aborting because user requested fallback`);
        throw new FallbackRequestedError();
      }

      if (
        error instanceof Fido2AutenticatorError &&
        error.errorCode === Fido2AutenticatorErrorCode.InvalidState
      ) {
        this.logService?.warning(`[Fido2Client] Unknown error: ${error}`);
        throw new DOMException(undefined, "InvalidStateError");
      }

      this.logService?.info(`[Fido2Client] Aborted by user: ${error}`);
      throw new DOMException(undefined, "NotAllowedError");
    }

    if (abortController.signal.aborted) {
      this.logService?.info(`[Fido2Client] Aborted with AbortController`);
      throw new DOMException(undefined, "AbortError");
    }

    clearTimeout(timeout);
    return {
      credentialId: Fido2Utils.bufferToString(makeCredentialResult.credentialId),
      attestationObject: Fido2Utils.bufferToString(makeCredentialResult.attestationObject),
      authData: Fido2Utils.bufferToString(makeCredentialResult.authData),
      clientDataJSON: Fido2Utils.bufferToString(clientDataJSONBytes),
      publicKeyAlgorithm: makeCredentialResult.publicKeyAlgorithm,
      transports: ["hybrid"],
    };
  }

  async assertCredential(
    params: AssertCredentialParams,
    abortController = new AbortController()
  ): Promise<AssertCredentialResult> {
    const enableFido2VaultCredentials = await this.configService.getFeatureFlagBool(
      FeatureFlag.Fido2VaultCredentials
    );

    if (!enableFido2VaultCredentials) {
      this.logService?.warning(`[Fido2Client] Fido2VaultCredential is not enabled`);
      throw new FallbackRequestedError();
    }

    const { domain: effectiveDomain } = parse(params.origin, { allowPrivateDomains: true });
    if (effectiveDomain == undefined) {
      this.logService?.warning(`[Fido2Client] Invalid origin: ${params.origin}`);
      throw new DOMException("'origin' is not a valid domain", "SecurityError");
    }

    const parsedOrigin = parse(params.origin, { allowPrivateDomains: true });
    const rpId = params.rpId ?? parsedOrigin.hostname;

    if (parsedOrigin.hostname == undefined || !params.origin.startsWith("https://")) {
      this.logService?.warning(`[Fido2Client] Invalid https origin: ${params.origin}`);
      throw new DOMException("'origin' is not a valid https origin", "SecurityError");
    }

    if (!isValidRpId(rpId, params.origin)) {
      this.logService?.warning(
        `[Fido2Client] 'rp.id' cannot be used with the current origin: rp.id = ${rpId}; origin = ${params.origin}`
      );
      throw new DOMException("'rp.id' cannot be used with the current origin", "SecurityError");
    }

    const collectedClientData = {
      type: "webauthn.get",
      challenge: params.challenge,
      origin: params.origin,
      crossOrigin: !params.sameOriginWithAncestors,
      // tokenBinding: {} // Not currently supported
    };
    const clientDataJSON = JSON.stringify(collectedClientData);
    const clientDataJSONBytes = Utils.fromByteStringToArray(clientDataJSON);
    const clientDataHash = await crypto.subtle.digest({ name: "SHA-256" }, clientDataJSONBytes);

    if (abortController.signal.aborted) {
      this.logService?.info(`[Fido2Client] Aborted with AbortController`);
      throw new DOMException(undefined, "AbortError");
    }

    const timeout = setAbortTimeout(abortController, params.userVerification, params.timeout);

    const allowCredentialDescriptorList: PublicKeyCredentialDescriptor[] =
      params.allowedCredentialIds.map((id) => ({
        id: Fido2Utils.stringToBuffer(id),
        type: "public-key",
      }));

    const getAssertionParams: Fido2AuthenticatorGetAssertionParams = {
      rpId,
      requireUserVerification: params.userVerification === "required",
      hash: clientDataHash,
      allowCredentialDescriptorList,
      extensions: {},
      fallbackSupported: params.fallbackSupported,
    };

    let getAssertionResult;
    try {
      getAssertionResult = await this.authenticator.getAssertion(
        getAssertionParams,
        abortController
      );
    } catch (error) {
      if (
        abortController.signal.aborted &&
        abortController.signal.reason === UserRequestedFallbackAbortReason
      ) {
        this.logService?.info(`[Fido2Client] Aborting because user requested fallback`);
        throw new FallbackRequestedError();
      }

      if (
        error instanceof Fido2AutenticatorError &&
        error.errorCode === Fido2AutenticatorErrorCode.InvalidState
      ) {
        this.logService?.warning(`[Fido2Client] Unknown error: ${error}`);
        throw new DOMException(undefined, "InvalidStateError");
      }

      this.logService?.info(`[Fido2Client] Aborted by user: ${error}`);
      throw new DOMException(undefined, "NotAllowedError");
    }

    if (abortController.signal.aborted) {
      this.logService?.info(`[Fido2Client] Aborted with AbortController`);
      throw new DOMException(undefined, "AbortError");
    }
    clearTimeout(timeout);

    return {
      authenticatorData: Fido2Utils.bufferToString(getAssertionResult.authenticatorData),
      clientDataJSON: Fido2Utils.bufferToString(clientDataJSONBytes),
      credentialId: Fido2Utils.bufferToString(getAssertionResult.selectedCredential.id),
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

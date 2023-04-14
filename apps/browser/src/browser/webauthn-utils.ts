import {
  CreateCredentialParams,
  CreateCredentialResult,
  AssertCredentialParams,
  AssertCredentialResult,
} from "@bitwarden/common/fido2/abstractions/fido2-client.service.abstraction";
import { Fido2Utils } from "@bitwarden/common/fido2/abstractions/fido2-utils";

class BitAuthenticatorAttestationResponse implements AuthenticatorAttestationResponse {
  clientDataJSON: ArrayBuffer;
  attestationObject: ArrayBuffer;

  constructor(private result: CreateCredentialResult) {
    this.clientDataJSON = Fido2Utils.stringToBuffer(result.clientDataJSON);
    this.attestationObject = Fido2Utils.stringToBuffer(result.attestationObject);
  }

  getAuthenticatorData(): ArrayBuffer {
    return Fido2Utils.stringToBuffer(this.result.authData);
  }

  getPublicKey(): ArrayBuffer {
    return null;
  }

  getPublicKeyAlgorithm(): number {
    return this.result.publicKeyAlgorithm;
  }

  getTransports(): string[] {
    return this.result.transports;
  }
}

export class WebauthnUtils {
  static mapCredentialCreationOptions(
    options: CredentialCreationOptions,
    origin: string,
    sameOriginWithAncestors: boolean
  ): CreateCredentialParams {
    const keyOptions = options.publicKey;

    if (keyOptions == undefined) {
      throw new Error("Public-key options not found");
    }

    return {
      origin,
      attestation: keyOptions.attestation,
      authenticatorSelection: {
        requireResidentKey: keyOptions.authenticatorSelection?.requireResidentKey,
        residentKey: keyOptions.authenticatorSelection?.residentKey,
        userVerification: keyOptions.authenticatorSelection?.userVerification,
      },
      challenge: Fido2Utils.bufferToString(keyOptions.challenge),
      excludeCredentials: keyOptions.excludeCredentials?.map((credential) => ({
        id: Fido2Utils.bufferToString(credential.id),
        transports: credential.transports,
        type: credential.type,
      })),
      extensions: undefined, // extensions not currently supported
      pubKeyCredParams: keyOptions.pubKeyCredParams.map((params) => ({
        alg: params.alg,
        type: params.type,
      })),
      rp: {
        id: keyOptions.rp.id,
        name: keyOptions.rp.name,
      },
      user: {
        id: Fido2Utils.bufferToString(keyOptions.user.id),
        displayName: keyOptions.user.displayName,
      },
      timeout: keyOptions.timeout,
      sameOriginWithAncestors,
    };
  }

  static mapCredentialRegistrationResult(result: CreateCredentialResult): PublicKeyCredential {
    return {
      id: result.credentialId,
      rawId: Fido2Utils.stringToBuffer(result.credentialId),
      type: "public-key",
      authenticatorAttachment: "cross-platform",
      response: new BitAuthenticatorAttestationResponse(result),
      getClientExtensionResults: () => ({}),
    } as any;
  }

  static mapCredentialRequestOptions(
    options: CredentialRequestOptions,
    origin: string,
    sameOriginWithAncestors: boolean
  ): AssertCredentialParams {
    const keyOptions = options.publicKey;

    if (keyOptions == undefined) {
      throw new Error("Public-key options not found");
    }

    return {
      origin,
      allowedCredentialIds:
        keyOptions.allowCredentials?.map((c) => Fido2Utils.bufferToString(c.id)) ?? [],
      challenge: Fido2Utils.bufferToString(keyOptions.challenge),
      rpId: keyOptions.rpId,
      userVerification: keyOptions.userVerification,
      timeout: keyOptions.timeout,
      sameOriginWithAncestors,
    };
  }

  static mapCredentialAssertResult(result: AssertCredentialResult): PublicKeyCredential {
    return {
      id: result.credentialId,
      rawId: Fido2Utils.stringToBuffer(result.credentialId),
      type: "public-key",
      response: {
        authenticatorData: Fido2Utils.stringToBuffer(result.authenticatorData),
        clientDataJSON: Fido2Utils.stringToBuffer(result.clientDataJSON),
        signature: Fido2Utils.stringToBuffer(result.signature),
        userHandle: Fido2Utils.stringToBuffer(result.userHandle),
      } as AuthenticatorAssertionResponse,
      getClientExtensionResults: () => ({}),
      authenticatorAttachment: "hybrid",
    };
  }
}

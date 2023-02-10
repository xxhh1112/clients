import { Fido2Utils } from "@bitwarden/common/webauthn/abstractions/fido2-utils";
import {
  CredentialAssertParams,
  CredentialAssertResult,
  CredentialRegistrationParams,
  CredentialRegistrationResult,
} from "@bitwarden/common/webauthn/abstractions/fido2.service.abstraction";

class BitAuthenticatorAttestationResponse implements AuthenticatorAttestationResponse {
  clientDataJSON: ArrayBuffer;
  attestationObject: ArrayBuffer;

  constructor(private result: CredentialRegistrationResult) {
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
    origin: string
  ): CredentialRegistrationParams {
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
      })),
      extensions: {
        appid: keyOptions.extensions?.appid,
        appidExclude: keyOptions.extensions?.appidExclude,
        credProps: keyOptions.extensions?.credProps,
        uvm: keyOptions.extensions?.uvm,
      },
      pubKeyCredParams: keyOptions.pubKeyCredParams.map((params) => ({
        alg: params.alg,
      })),
      rp: {
        id: keyOptions.rp.id,
        name: keyOptions.rp.name,
      },
      user: {
        id: Fido2Utils.bufferToString(keyOptions.user.id),
        displayName: keyOptions.user.displayName,
      },
    };
  }

  static mapCredentialRegistrationResult(
    result: CredentialRegistrationResult
  ): PublicKeyCredential {
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
    origin: string
  ): CredentialAssertParams {
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
    };
  }

  static mapCredentialAssertResult(result: CredentialAssertResult): PublicKeyCredential {
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
    };
  }
}

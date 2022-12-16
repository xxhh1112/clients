import { Fido2Utils } from "@bitwarden/common/abstractions/fido2/fido2-utils";
import {
  CredentialAssertParams,
  CredentialAssertResult,
  CredentialRegistrationParams,
  CredentialRegistrationResult,
} from "@bitwarden/common/abstractions/fido2/fido2.service.abstraction";

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
      response: {
        clientDataJSON: Fido2Utils.stringToBuffer(result.clientDataJSON),
        attestationObject: Fido2Utils.stringToBuffer(result.attestationObject),
      } as AuthenticatorAttestationResponse,
      getClientExtensionResults: () => ({}),
    };
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

import { Fido2Utils } from "@bitwarden/common/abstractions/fido2/fido2-utils";
import { CredentialRegistrationParams } from "@bitwarden/common/abstractions/fido2/fido2.service.abstraction";

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
}

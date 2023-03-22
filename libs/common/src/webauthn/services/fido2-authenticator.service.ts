import { CipherService } from "../../vault/services/cipher.service";
import {
  Fido2AlgorithmIdentifier,
  Fido2AutenticatorError,
  Fido2AutenticatorErrorCode,
  Fido2AuthenticatorMakeCredentialsParams,
  Fido2AuthenticatorService as Fido2AuthenticatorServiceAbstraction,
} from "../abstractions/fido2-authenticator.service.abstraction";
import { Fido2UserInterfaceService } from "../abstractions/fido2-user-interface.service.abstraction";
import { Fido2Utils } from "../abstractions/fido2-utils";

/**
 * Bitwarden implementation of the Authenticator API described by the FIDO Alliance
 * https://fidoalliance.org/specs/fido-v2.0-ps-20190130/fido-client-to-authenticator-protocol-v2.0-ps-20190130.html
 */
export class Fido2AuthenticatorService implements Fido2AuthenticatorServiceAbstraction {
  constructor(
    private cipherService: CipherService,
    private userInterface: Fido2UserInterfaceService
  ) {}

  async makeCredential(params: Fido2AuthenticatorMakeCredentialsParams): Promise<void> {
    if (params.pubKeyCredParams.every((p) => p.alg !== Fido2AlgorithmIdentifier.ES256)) {
      throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.CTAP2_ERR_UNSUPPORTED_ALGORITHM);
    }

    if (params.options?.rk != undefined && typeof params.options.rk !== "boolean") {
      throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.CTAP2_ERR_INVALID_OPTION);
    }

    if (params.options?.uv != undefined && typeof params.options.uv !== "boolean") {
      throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.CTAP2_ERR_INVALID_OPTION);
    }

    if (params.pinAuth != undefined) {
      throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.CTAP2_ERR_PIN_AUTH_INVALID);
    }

    // In the spec the `excludeList` is checked first.
    // We deviate from this because we allow duplicates to be created if the user confirms it,
    // and we don't want to ask the user for confirmation if the input params haven't already
    // been verified.
    const duplicateExists = await this.vaultContainsId(
      params.excludeList.map((key) => Fido2Utils.bufferToString(key.id))
    );
    let userVerification = false;

    if (duplicateExists) {
      userVerification = await this.userInterface.confirmDuplicateCredential(
        [Fido2Utils.bufferToString(params.excludeList[0].id)],
        {
          credentialName: params.rp.name,
          userName: params.user.name,
        }
      );
    } else {
      userVerification = await this.userInterface.confirmNewCredential({
        credentialName: params.rp.name,
        userName: params.user.name,
      });
    }

    if (!userVerification && duplicateExists) {
      throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.CTAP2_ERR_CREDENTIAL_EXCLUDED);
    } else if (!userVerification && !duplicateExists) {
      throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.CTAP2_ERR_OPERATION_DENIED);
    }
  }

  private async vaultContainsId(ids: string[]): Promise<boolean> {
    for (const id of ids) {
      if ((await this.cipherService.get(id)) != undefined) {
        return true;
      }
    }

    return false;
  }
}
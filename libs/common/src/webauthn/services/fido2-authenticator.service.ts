import { CipherService } from "../../vault/services/cipher.service";
import {
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
    const userConfirmation = await this.userInterface.confirmDuplicateCredential(
      [Fido2Utils.bufferToString(params.excludeList[0].id)],
      {
        credentialName: params.rp.name,
        userName: params.user.name,
      }
    );

    if (!userConfirmation) {
      throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.CTAP2_ERR_CREDENTIAL_EXCLUDED);
    }
  }
}

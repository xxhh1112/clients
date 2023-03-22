import { CipherType } from "../../vault/enums/cipher-type";
import { CipherView } from "../../vault/models/view/cipher.view";
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
import { Fido2KeyView } from "../models/view/fido2-key.view";

const KeyUsages: KeyUsage[] = ["sign"];

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

    const isExcluded = await this.vaultContainsId(
      params.excludeList.map((key) => Fido2Utils.bufferToString(key.id))
    );

    if (isExcluded) {
      await this.userInterface.informExcludedCredential(
        [Fido2Utils.bufferToString(params.excludeList[0].id)],
        {
          credentialName: params.rp.name,
          userName: params.user.name,
        }
      );

      throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.CTAP2_ERR_CREDENTIAL_EXCLUDED);
    }

    const userVerification = await this.userInterface.confirmNewCredential({
      credentialName: params.rp.name,
      userName: params.user.name,
    });

    if (!userVerification) {
      throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.CTAP2_ERR_OPERATION_DENIED);
    }

    const keyPair = await this.createKeyPair();
    const vaultItem = await this.createVaultItem(params, keyPair.privateKey);

    const encrypted = await this.cipherService.encrypt(vaultItem);
    await this.cipherService.createWithServer(encrypted);
  }

  private async vaultContainsId(ids: string[]): Promise<boolean> {
    for (const id of ids) {
      if ((await this.cipherService.get(id)) != undefined) {
        return true;
      }
    }

    return false;
  }

  private async createKeyPair() {
    return await crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      KeyUsages
    );
  }

  private async createVaultItem(
    params: Fido2AuthenticatorMakeCredentialsParams,
    keyValue: CryptoKey
  ): Promise<CipherView> {
    const pcks8Key = await crypto.subtle.exportKey("pkcs8", keyValue);

    const view = new CipherView();
    view.type = CipherType.Fido2Key;
    view.name = params.rp.name;

    view.fido2Key = new Fido2KeyView();
    view.fido2Key.keyType = "ECDSA";
    view.fido2Key.keyCurve = "P-256";
    view.fido2Key.keyValue = Fido2Utils.bufferToString(pcks8Key);
    view.fido2Key.rpId = params.rp.id;
    view.fido2Key.rpName = params.rp.name;
    view.fido2Key.userHandle = Fido2Utils.bufferToString(params.user.id);
    view.fido2Key.userName = params.user.name;

    return view;
  }
}

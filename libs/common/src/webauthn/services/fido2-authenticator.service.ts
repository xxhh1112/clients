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
 * Bitwarden implementation of the WebAuthn Authenticator Model described by W3C
 * https://www.w3.org/TR/webauthn-3/#sctn-authenticator-model
 */
export class Fido2AuthenticatorService implements Fido2AuthenticatorServiceAbstraction {
  constructor(
    private cipherService: CipherService,
    private userInterface: Fido2UserInterfaceService
  ) {}

  async makeCredential(params: Fido2AuthenticatorMakeCredentialsParams): Promise<void> {
    if (params.credTypesAndPubKeyAlgs.every((p) => p.alg !== Fido2AlgorithmIdentifier.ES256)) {
      throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.NotSupported);
    }

    if (params.requireResidentKey != undefined && typeof params.requireResidentKey !== "boolean") {
      throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.Unknown);
    }

    if (
      params.requireUserVerification != undefined &&
      typeof params.requireUserVerification !== "boolean"
    ) {
      throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.Unknown);
    }

    if (params.requireUserVerification) {
      throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.Constraint);
    }

    const isExcluded = await this.vaultContainsId(
      params.excludeCredentialDescriptorList.map((key) => Fido2Utils.bufferToString(key.id))
    );

    if (isExcluded) {
      await this.userInterface.informExcludedCredential(
        [Fido2Utils.bufferToString(params.excludeCredentialDescriptorList[0].id)],
        {
          credentialName: params.rpEntity.name,
          userName: params.userEntity.name,
        }
      );

      throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.NotAllowed);
    }

    if (params.requireResidentKey) {
      const userVerification = await this.userInterface.confirmNewCredential({
        credentialName: params.rpEntity.name,
        userName: params.userEntity.name,
      });

      if (!userVerification) {
        throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.NotAllowed);
      }

      try {
        const keyPair = await this.createKeyPair();

        const cipher = new CipherView();
        cipher.type = CipherType.Fido2Key;
        cipher.name = params.rpEntity.name;
        cipher.fido2Key = await this.createKeyView(params, keyPair.privateKey);
        const encrypted = await this.cipherService.encrypt(cipher);
        await this.cipherService.createWithServer(encrypted);
      } catch {
        throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.Unknown);
      }
    } else {
      const cipherId = await this.userInterface.confirmNewNonDiscoverableCredential({
        credentialName: params.rpEntity.name,
        userName: params.userEntity.name,
      });

      if (cipherId === undefined) {
        throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.NotAllowed);
      }

      try {
        const keyPair = await this.createKeyPair();

        const encrypted = await this.cipherService.get(cipherId);
        const cipher = await encrypted.decrypt();
        cipher.fido2Key = await this.createKeyView(params, keyPair.privateKey);
        const reencrypted = await this.cipherService.encrypt(cipher);
        await this.cipherService.updateWithServer(reencrypted);
      } catch {
        throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.Unknown);
      }
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

  private async createKeyView(
    params: Fido2AuthenticatorMakeCredentialsParams,
    keyValue: CryptoKey
  ): Promise<Fido2KeyView> {
    const pcks8Key = await crypto.subtle.exportKey("pkcs8", keyValue);

    const fido2Key = new Fido2KeyView();
    fido2Key.keyType = "ECDSA";
    fido2Key.keyCurve = "P-256";
    fido2Key.keyValue = Fido2Utils.bufferToString(pcks8Key);
    fido2Key.rpId = params.rpEntity.id;
    fido2Key.rpName = params.rpEntity.name;
    fido2Key.userHandle = Fido2Utils.bufferToString(params.userEntity.id);
    fido2Key.userName = params.userEntity.name;

    return fido2Key;
  }
}

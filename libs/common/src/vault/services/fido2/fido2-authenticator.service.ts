import { CBOR } from "cbor-redux";

import { LogService } from "../../../platform/abstractions/log.service";
import { Utils } from "../../../platform/misc/utils";
import { CipherService } from "../../abstractions/cipher.service";
import {
  Fido2AlgorithmIdentifier,
  Fido2AutenticatorError,
  Fido2AutenticatorErrorCode,
  Fido2AuthenticatorGetAssertionParams,
  Fido2AuthenticatorGetAssertionResult,
  Fido2AuthenticatorMakeCredentialResult,
  Fido2AuthenticatorMakeCredentialsParams,
  Fido2AuthenticatorService as Fido2AuthenticatorServiceAbstraction,
  PublicKeyCredentialDescriptor,
} from "../../abstractions/fido2/fido2-authenticator.service.abstraction";
import { Fido2UserInterfaceService } from "../../abstractions/fido2/fido2-user-interface.service.abstraction";
import { CipherType } from "../../enums/cipher-type";
import { CipherView } from "../../models/view/cipher.view";
import { Fido2KeyView } from "../../models/view/fido2-key.view";

import { joseToDer } from "./ecdsa-utils";
import { Fido2Utils } from "./fido2-utils";

// AAGUID: 6e8248d5-b479-40db-a3d8-11116f7e8349
export const AAGUID = new Uint8Array([
  0xd5, 0x48, 0x82, 0x6e, 0x79, 0xb4, 0xdb, 0x40, 0xa3, 0xd8, 0x11, 0x11, 0x6f, 0x7e, 0x83, 0x49,
]);

const KeyUsages: KeyUsage[] = ["sign"];

/**
 * Bitwarden implementation of the WebAuthn Authenticator Model described by W3C
 * https://www.w3.org/TR/webauthn-3/#sctn-authenticator-model
 */
export class Fido2AuthenticatorService implements Fido2AuthenticatorServiceAbstraction {
  constructor(
    private cipherService: CipherService,
    private userInterface: Fido2UserInterfaceService,
    private logService?: LogService
  ) {}
  async makeCredential(
    params: Fido2AuthenticatorMakeCredentialsParams,
    abortController?: AbortController
  ): Promise<Fido2AuthenticatorMakeCredentialResult> {
    const userInterfaceSession = await this.userInterface.newSession(
      params.fallbackSupported,
      abortController
    );

    try {
      if (params.credTypesAndPubKeyAlgs.every((p) => p.alg !== Fido2AlgorithmIdentifier.ES256)) {
        const requestedAlgorithms = params.credTypesAndPubKeyAlgs.map((p) => p.alg).join(", ");
        this.logService?.warning(
          `[Fido2Authenticator] No compatible algorithms found, RP requested: ${requestedAlgorithms}`
        );
        throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.NotSupported);
      }

      if (
        params.requireResidentKey != undefined &&
        typeof params.requireResidentKey !== "boolean"
      ) {
        this.logService?.error(
          `[Fido2Authenticator] Invalid 'requireResidentKey' value: ${String(
            params.requireResidentKey
          )}`
        );
        throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.Unknown);
      }

      if (
        params.requireUserVerification != undefined &&
        typeof params.requireUserVerification !== "boolean"
      ) {
        this.logService?.error(
          `[Fido2Authenticator] Invalid 'requireUserVerification' value: ${String(
            params.requireUserVerification
          )}`
        );
        throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.Unknown);
      }

      const existingCipherIds = await this.findExcludedCredentials(
        params.excludeCredentialDescriptorList
      );
      if (existingCipherIds.length > 0) {
        this.logService?.info(
          `[Fido2Authenticator] Aborting due to excluded credential found in vault.`
        );
        await userInterfaceSession.informExcludedCredential(existingCipherIds, abortController);
        throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.NotAllowed);
      }

      let cipher: CipherView;
      let fido2Key: Fido2KeyView;
      let keyPair: CryptoKeyPair;
      let userVerified = false;
      if (params.requireResidentKey) {
        const response = await userInterfaceSession.confirmNewCredential(
          {
            credentialName: params.rpEntity.name,
            userName: params.userEntity.displayName,
            userVerification: params.requireUserVerification,
          },
          abortController
        );
        const userConfirmation = response.confirmed;
        userVerified = response.userVerified;

        if (!userConfirmation) {
          this.logService?.warning(
            `[Fido2Authenticator] Aborting because user confirmation was not recieved.`
          );
          throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.NotAllowed);
        }

        if (params.requireUserVerification && !userVerified) {
          this.logService?.warning(
            `[Fido2Authenticator] Aborting because user verification was not successful.`
          );
          throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.NotAllowed);
        }

        try {
          keyPair = await createKeyPair();

          cipher = new CipherView();
          cipher.type = CipherType.Fido2Key;
          cipher.name = params.rpEntity.name;
          cipher.fido2Key = fido2Key = await createKeyView(params, keyPair.privateKey);
          const encrypted = await this.cipherService.encrypt(cipher);
          await this.cipherService.createWithServer(encrypted); // encrypted.id is assigned inside here
          cipher.id = encrypted.id;
        } catch (error) {
          this.logService?.error(
            `[Fido2Authenticator] Aborting because of unknown error when creating discoverable credential: ${error}`
          );
          throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.Unknown);
        }
      } else {
        const response = await userInterfaceSession.confirmNewNonDiscoverableCredential(
          {
            credentialName: params.rpEntity.name,
            userName: params.userEntity.displayName,
            userVerification: params.requireUserVerification,
          },
          abortController
        );
        const cipherId = response.cipherId;
        userVerified = response.userVerified;

        if (cipherId === undefined) {
          this.logService?.warning(
            `[Fido2Authenticator] Aborting because user confirmation was not recieved.`
          );
          throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.NotAllowed);
        }

        if (params.requireUserVerification && !userVerified) {
          this.logService?.warning(
            `[Fido2Authenticator] Aborting because user verification was unsuccessful.`
          );
          throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.NotAllowed);
        }

        try {
          keyPair = await createKeyPair();

          const encrypted = await this.cipherService.get(cipherId);
          cipher = await encrypted.decrypt();
          cipher.login.fido2Key = fido2Key = await createKeyView(params, keyPair.privateKey);
          const reencrypted = await this.cipherService.encrypt(cipher);
          await this.cipherService.updateWithServer(reencrypted);
        } catch (error) {
          this.logService?.error(
            `[Fido2Authenticator] Aborting because of unknown error when creating non-discoverable credential: ${error}`
          );
          throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.Unknown);
        }
      }

      const credentialId =
        cipher.type === CipherType.Fido2Key ? cipher.id : cipher.login.fido2Key.nonDiscoverableId;

      const authData = await generateAuthData({
        rpId: params.rpEntity.id,
        credentialId: Utils.guidToRawFormat(credentialId),
        counter: fido2Key.counter,
        userPresence: true,
        userVerification: userVerified,
        keyPair,
      });
      const attestationObject = new Uint8Array(
        CBOR.encode({
          fmt: "none",
          attStmt: {},
          authData,
        })
      );

      return {
        credentialId: Utils.guidToRawFormat(credentialId),
        attestationObject,
        authData,
        publicKeyAlgorithm: -7,
      };
    } finally {
      userInterfaceSession.close();
    }
  }

  async getAssertion(
    params: Fido2AuthenticatorGetAssertionParams,
    abortController?: AbortController
  ): Promise<Fido2AuthenticatorGetAssertionResult> {
    const userInterfaceSession = await this.userInterface.newSession(
      params.fallbackSupported,
      abortController
    );

    try {
      if (
        params.requireUserVerification != undefined &&
        typeof params.requireUserVerification !== "boolean"
      ) {
        this.logService?.error(
          `[Fido2Authenticator] Invalid 'requireUserVerification' value: ${String(
            params.requireUserVerification
          )}`
        );
        throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.Unknown);
      }

      let cipherOptions: CipherView[];

      // eslint-disable-next-line no-empty
      if (params.allowCredentialDescriptorList?.length > 0) {
        cipherOptions = await this.findCredentialsById(
          params.allowCredentialDescriptorList,
          params.rpId
        );
      } else {
        cipherOptions = await this.findCredentialsByRp(params.rpId);
      }

      if (cipherOptions.length === 0) {
        this.logService?.info(
          `[Fido2Authenticator] Aborting because no matching credentials were found in the vault.`
        );
        await userInterfaceSession.informCredentialNotFound();
        throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.NotAllowed);
      }

      const response = await userInterfaceSession.pickCredential({
        cipherIds: cipherOptions.map((cipher) => cipher.id),
        userVerification: params.requireUserVerification,
      });
      const selectedCipherId = response.cipherId;
      const userVerified = response.userVerified;
      const selectedCipher = cipherOptions.find((c) => c.id === selectedCipherId);

      if (selectedCipher === undefined) {
        this.logService?.error(
          `[Fido2Authenticator] Aborting because the selected credential could not be found.`
        );
        throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.NotAllowed);
      }

      if (params.requireUserVerification && !userVerified) {
        this.logService?.warning(
          `[Fido2Authenticator] Aborting because user verification was unsuccessful.`
        );
        throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.NotAllowed);
      }

      try {
        const selectedFido2Key =
          selectedCipher.type === CipherType.Login
            ? selectedCipher.login.fido2Key
            : selectedCipher.fido2Key;
        const selectedCredentialId =
          selectedCipher.type === CipherType.Login
            ? selectedFido2Key.nonDiscoverableId
            : selectedCipher.id;

        ++selectedFido2Key.counter;

        selectedCipher.localData = {
          ...selectedCipher.localData,
          lastUsedDate: new Date().getTime(),
        };
        const encrypted = await this.cipherService.encrypt(selectedCipher);
        await this.cipherService.updateWithServer(encrypted);

        const authenticatorData = await generateAuthData({
          rpId: selectedFido2Key.rpId,
          credentialId: Utils.guidToRawFormat(selectedCredentialId),
          counter: selectedFido2Key.counter,
          userPresence: true,
          userVerification: userVerified,
        });

        const signature = await generateSignature({
          authData: authenticatorData,
          clientDataHash: params.hash,
          privateKey: await getPrivateKeyFromFido2Key(selectedFido2Key),
        });

        return {
          authenticatorData,
          selectedCredential: {
            id: Utils.guidToRawFormat(selectedCredentialId),
            userHandle: Fido2Utils.stringToBuffer(selectedFido2Key.userHandle),
          },
          signature,
        };
      } catch (error) {
        this.logService?.error(
          `[Fido2Authenticator] Aborting because of unknown error when asserting credential: ${error}`
        );
        throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.Unknown);
      }
    } finally {
      userInterfaceSession.close();
    }
  }

  /** Finds existing crendetials and returns the `cipherId` for each one */
  private async findExcludedCredentials(
    credentials: PublicKeyCredentialDescriptor[]
  ): Promise<string[]> {
    const ids: string[] = [];

    for (const credential of credentials) {
      try {
        ids.push(Utils.guidToStandardFormat(credential.id));
        // eslint-disable-next-line no-empty
      } catch {}
    }

    if (ids.length === 0) {
      return [];
    }

    const ciphers = await this.cipherService.getAllDecrypted();
    return ciphers
      .filter(
        (cipher) =>
          !cipher.isDeleted &&
          cipher.organizationId == undefined &&
          ((cipher.type === CipherType.Fido2Key && ids.includes(cipher.id)) ||
            (cipher.type === CipherType.Login &&
              cipher.login.fido2Key != undefined &&
              ids.includes(cipher.login.fido2Key.nonDiscoverableId)))
      )
      .map((cipher) => cipher.id);
  }

  private async findCredentialsById(
    credentials: PublicKeyCredentialDescriptor[],
    rpId: string
  ): Promise<CipherView[]> {
    const ids: string[] = [];

    for (const credential of credentials) {
      try {
        ids.push(Utils.guidToStandardFormat(credential.id));
        // eslint-disable-next-line no-empty
      } catch {}
    }

    if (ids.length === 0) {
      return [];
    }

    const ciphers = await this.cipherService.getAllDecrypted();
    return ciphers.filter(
      (cipher) =>
        (!cipher.isDeleted &&
          cipher.type === CipherType.Login &&
          cipher.login.fido2Key != undefined &&
          cipher.login.fido2Key.rpId === rpId &&
          ids.includes(cipher.login.fido2Key.nonDiscoverableId)) ||
        (cipher.type === CipherType.Fido2Key &&
          cipher.fido2Key.rpId === rpId &&
          ids.includes(cipher.id))
    );
  }

  private async findCredentialsByRp(rpId: string): Promise<CipherView[]> {
    const ciphers = await this.cipherService.getAllDecrypted();
    return ciphers.filter(
      (cipher) =>
        !cipher.isDeleted && cipher.type === CipherType.Fido2Key && cipher.fido2Key.rpId === rpId
    );
  }
}

async function createKeyPair() {
  return await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    KeyUsages
  );
}

async function createKeyView(
  params: Fido2AuthenticatorMakeCredentialsParams,
  keyValue: CryptoKey
): Promise<Fido2KeyView> {
  if (keyValue.algorithm.name !== "ECDSA" && (keyValue.algorithm as any).namedCurve !== "P-256") {
    throw new Fido2AutenticatorError(Fido2AutenticatorErrorCode.Unknown);
  }

  const pkcs8Key = await crypto.subtle.exportKey("pkcs8", keyValue);
  const fido2Key = new Fido2KeyView();
  fido2Key.nonDiscoverableId = params.requireResidentKey ? null : Utils.newGuid();
  fido2Key.keyType = "public-key";
  fido2Key.keyAlgorithm = "ECDSA";
  fido2Key.keyCurve = "P-256";
  fido2Key.keyValue = Fido2Utils.bufferToString(pkcs8Key);
  fido2Key.rpId = params.rpEntity.id;
  fido2Key.userHandle = Fido2Utils.bufferToString(params.userEntity.id);
  fido2Key.counter = 0;
  fido2Key.rpName = params.rpEntity.name;
  fido2Key.userName = params.userEntity.displayName;

  return fido2Key;
}

async function getPrivateKeyFromFido2Key(fido2Key: Fido2KeyView): Promise<CryptoKey> {
  const keyBuffer = Fido2Utils.stringToBuffer(fido2Key.keyValue);
  return await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    {
      name: fido2Key.keyAlgorithm,
      namedCurve: fido2Key.keyCurve,
    } as EcKeyImportParams,
    true,
    KeyUsages
  );
}

interface AuthDataParams {
  rpId: string;
  credentialId: BufferSource;
  userPresence: boolean;
  userVerification: boolean;
  counter: number;
  keyPair?: CryptoKeyPair;
}

async function generateAuthData(params: AuthDataParams) {
  const authData: Array<number> = [];

  const rpIdHash = new Uint8Array(
    await crypto.subtle.digest({ name: "SHA-256" }, Utils.fromByteStringToArray(params.rpId))
  );
  authData.push(...rpIdHash);

  const flags = authDataFlags({
    extensionData: false,
    attestationData: params.keyPair != undefined,
    userVerification: params.userVerification,
    userPresence: params.userPresence,
  });
  authData.push(flags);

  // add 4 bytes of counter - we use time in epoch seconds as monotonic counter
  // TODO: Consider changing this to a cryptographically safe random number
  const counter = params.counter;
  authData.push(
    ((counter & 0xff000000) >> 24) & 0xff,
    ((counter & 0x00ff0000) >> 16) & 0xff,
    ((counter & 0x0000ff00) >> 8) & 0xff,
    counter & 0x000000ff
  );

  if (params.keyPair) {
    // attestedCredentialData
    const attestedCredentialData: Array<number> = [];

    attestedCredentialData.push(...AAGUID);

    // credentialIdLength (2 bytes) and credential Id
    const rawId = Fido2Utils.bufferSourceToUint8Array(params.credentialId);
    const credentialIdLength = [(rawId.length - (rawId.length & 0xff)) / 256, rawId.length & 0xff];
    attestedCredentialData.push(...credentialIdLength);
    attestedCredentialData.push(...rawId);

    const publicKeyJwk = await crypto.subtle.exportKey("jwk", params.keyPair.publicKey);
    // COSE format of the EC256 key
    const keyX = Utils.fromUrlB64ToArray(publicKeyJwk.x);
    const keyY = Utils.fromUrlB64ToArray(publicKeyJwk.y);

    // Can't get `cbor-redux` to encode in CTAP2 canonical CBOR. So we do it manually:
    const coseBytes = new Uint8Array(77);
    coseBytes.set([0xa5, 0x01, 0x02, 0x03, 0x26, 0x20, 0x01, 0x21, 0x58, 0x20], 0);
    coseBytes.set(keyX, 10);
    coseBytes.set([0x22, 0x58, 0x20], 10 + 32);
    coseBytes.set(keyY, 10 + 32 + 3);

    // credential public key - convert to array from CBOR encoded COSE key
    attestedCredentialData.push(...coseBytes);

    authData.push(...attestedCredentialData);
  }

  return new Uint8Array(authData);
}

interface SignatureParams {
  authData: Uint8Array;
  clientDataHash: BufferSource;
  privateKey: CryptoKey;
}

async function generateSignature(params: SignatureParams) {
  const sigBase = new Uint8Array([
    ...params.authData,
    ...Fido2Utils.bufferSourceToUint8Array(params.clientDataHash),
  ]);
  const p1336_signature = new Uint8Array(
    await crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      params.privateKey,
      sigBase
    )
  );

  const asn1Der_signature = joseToDer(p1336_signature, "ES256");

  return asn1Der_signature;
}

interface Flags {
  extensionData: boolean;
  attestationData: boolean;
  userVerification: boolean;
  userPresence: boolean;
}

function authDataFlags(options: Flags): number {
  let flags = 0;

  if (options.extensionData) {
    flags |= 0b1000000;
  }

  if (options.attestationData) {
    flags |= 0b01000000;
  }

  if (options.userVerification) {
    flags |= 0b00000100;
  }

  if (options.userPresence) {
    flags |= 0b00000001;
  }

  return flags;
}

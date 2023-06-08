import { ProfileOrganizationResponse } from "../../admin-console/models/response/profile-organization.response";
import { ProfileProviderOrganizationResponse } from "../../admin-console/models/response/profile-provider-organization.response";
import { ProfileProviderResponse } from "../../admin-console/models/response/profile-provider.response";
import { KdfConfig } from "../../auth/models/domain/kdf-config";
import { KeySuffixOptions, KdfType, HashPurpose } from "../../enums";
import { EncArrayBuffer } from "../models/domain/enc-array-buffer";
import { EncString } from "../models/domain/enc-string";
import {
  MasterKey,
  PinKey,
  SymmetricCryptoKey,
  UserSymKey,
} from "../models/domain/symmetric-crypto-key";

export abstract class CryptoService {
  // TODO: This works right?
  getKeyForUserEncryption: (key?: SymmetricCryptoKey) => Promise<SymmetricCryptoKey>;

  setUserKey: (key: UserSymKey) => Promise<void>;
  /**
   * Gets the user key from memory and sets it again,
   * kicking off a refresh of any additional keys that are needed.
   */
  toggleKey: () => Promise<void>;
  getUserKeyFromMemory: (userId?: string) => Promise<UserSymKey>;
  getUserKeyFromStorage: (
    keySuffix: KeySuffixOptions.Auto | KeySuffixOptions.Biometric,
    userId?: string
  ) => Promise<UserSymKey>;
  hasUserKey: () => Promise<boolean>;
  hasUserKeyInMemory: (userId?: string) => Promise<boolean>;
  hasUserKeyStored: (
    keySuffix?: KeySuffixOptions.Auto | KeySuffixOptions.Biometric,
    userId?: string
  ) => Promise<boolean>;
  makeUserSymKey: (key: SymmetricCryptoKey) => Promise<[UserSymKey, EncString]>;
  clearUserKey: (clearSecretStorage?: boolean, userId?: string) => Promise<void>;
  setUserSymKeyMasterKey: (UserSymKeyMasterKey: string, userId?: string) => Promise<void>;
  setMasterKey: (key: MasterKey, userId?: string) => Promise<void>;
  getMasterKey: (userId?: string) => Promise<MasterKey>;
  makeMasterKey: (
    password: string,
    email: string,
    kdf: KdfType,
    KdfConfig: KdfConfig
  ) => Promise<MasterKey>;
  clearMasterKey: (userId?: string) => Promise<void>;
  encryptUserSymKeyWithMasterKey: (
    masterKey: MasterKey,
    userSymKey?: UserSymKey
  ) => Promise<[UserSymKey, EncString]>;
  decryptUserSymKeyWithMasterKey: (
    masterKey: MasterKey,
    userSymKey?: EncString,
    userId?: string
  ) => Promise<UserSymKey>;
  hashPassword: (password: string, key: MasterKey, hashPurpose?: HashPurpose) => Promise<string>;
  setKeyHash: (keyHash: string) => Promise<void>;
  getKeyHash: () => Promise<string>;
  clearKeyHash: () => Promise<void>;
  compareAndUpdateKeyHash: (masterPassword: string, key: MasterKey) => Promise<boolean>;
  setOrgKeys: (
    orgs: ProfileOrganizationResponse[],
    providerOrgs: ProfileProviderOrganizationResponse[]
  ) => Promise<void>;
  getOrgKey: (orgId: string) => Promise<SymmetricCryptoKey>;
  getOrgKeys: () => Promise<Map<string, SymmetricCryptoKey>>;
  clearOrgKeys: (memoryOnly?: boolean, userId?: string) => Promise<void>;
  setProviderKeys: (orgs: ProfileProviderResponse[]) => Promise<void>;
  getProviderKey: (providerId: string) => Promise<SymmetricCryptoKey>;
  getProviderKeys: () => Promise<Map<string, SymmetricCryptoKey>>;
  clearProviderKeys: (memoryOnly?: boolean) => Promise<void>;
  getPublicKey: () => Promise<ArrayBuffer>;
  makeShareKey: () => Promise<[EncString, SymmetricCryptoKey]>;
  setPrivateKey: (encPrivateKey: string) => Promise<void>;
  getPrivateKey: () => Promise<ArrayBuffer>;
  getFingerprint: (fingerprintMaterial: string, publicKey?: ArrayBuffer) => Promise<string[]>;
  makeKeyPair: (key?: SymmetricCryptoKey) => Promise<[string, EncString]>;
  clearKeyPair: (memoryOnly?: boolean, userId?: string) => Promise<void[]>;
  makePinKey: (pin: string, salt: string, kdf: KdfType, kdfConfig: KdfConfig) => Promise<PinKey>;
  clearPinProtectedKey: (userId?: string) => Promise<void>;
  clearOldPinKeys: (userId?: string) => Promise<void>;
  /**
   * Decrypts the user's symmetric key with their pin
   * @param pin The user's PIN
   * @param salt The user's salt
   * @param kdf The user's KDF
   * @param kdfConfig The user's KDF config
   * @param pinProtectedUserSymKey The user's PIN protected symmetric key, if not provided
   * it will be retrieved from storage
   * @returns The decrypted user's symmetric key
   */
  decryptUserSymKeyWithPin: (
    pin: string,
    salt: string,
    kdf: KdfType,
    kdfConfig: KdfConfig,
    protectedKeyCs?: EncString
  ) => Promise<UserSymKey>;
  /**
   * @deprecated Left for migration purposes. Use decryptUserSymKeyWithPin instead.
   */
  decryptMasterKeyWithPin: (
    pin: string,
    salt: string,
    kdf: KdfType,
    kdfConfig: KdfConfig,
    protectedKeyCs?: EncString
  ) => Promise<MasterKey>;
  makeSendKey: (keyMaterial: ArrayBuffer) => Promise<SymmetricCryptoKey>;
  clearKeys: (userId?: string) => Promise<any>;
  rsaEncrypt: (data: ArrayBuffer, publicKey?: ArrayBuffer) => Promise<EncString>;
  rsaDecrypt: (encValue: string, privateKeyValue?: ArrayBuffer) => Promise<ArrayBuffer>;
  randomNumber: (min: number, max: number) => Promise<number>;

  // deprecate
  encrypt: (plainValue: string | ArrayBuffer, key?: SymmetricCryptoKey) => Promise<EncString>;
  encryptToBytes: (plainValue: ArrayBuffer, key?: SymmetricCryptoKey) => Promise<EncArrayBuffer>;
  decryptToBytes: (encString: EncString, key?: SymmetricCryptoKey) => Promise<ArrayBuffer>;
  decryptToUtf8: (encString: EncString, key?: SymmetricCryptoKey) => Promise<string>;
  decryptFromBytes: (encBuffer: EncArrayBuffer, key: SymmetricCryptoKey) => Promise<ArrayBuffer>;
  setEncKey: (encKey: string) => Promise<void>;
  hasEncKey: () => Promise<boolean>;
  clearEncKey: (memoryOnly?: boolean, userId?: string) => Promise<any>;
}

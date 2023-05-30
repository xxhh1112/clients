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
  getUserKey: (keySuffix?: KeySuffixOptions, userId?: string) => Promise<UserSymKey>;
  getUserKeyFromStorage: (keySuffix: KeySuffixOptions, userId?: string) => Promise<UserSymKey>;
  hasUserKey: () => Promise<boolean>;
  hasUserKeyInMemory: (userId?: string) => Promise<boolean>;
  hasUserKeyStored: (keySuffix?: KeySuffixOptions, userId?: string) => Promise<boolean>;
  makeUserSymKey: (key: SymmetricCryptoKey) => Promise<[SymmetricCryptoKey, EncString]>;
  clearUserKey: (clearSecretStorage?: boolean, userId?: string) => Promise<void>;
  clearUserKeyFromStorage: (keySuffix: KeySuffixOptions) => Promise<void>;
  setMasterKey: (key: MasterKey, userId?: string) => Promise<void>;
  getMasterKey: (userId?: string) => Promise<MasterKey>;
  makeMasterKey: (
    password: string,
    email: string,
    kdf: KdfType,
    KdfConfig: KdfConfig
  ) => Promise<MasterKey>;
  encryptUserSymKeyWithMasterKey: (
    masterKey: MasterKey,
    userSymKey?: UserSymKey
  ) => Promise<[UserSymKey, EncString]>;
  decryptUserSymKeyWithMasterKey: (masterKey: MasterKey, userId?: string) => Promise<UserSymKey>;
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
  clearPinProtectedKey: () => Promise<void>;
  decryptUserSymKeyWithPin: (
    pin: string,
    salt: string,
    kdf: KdfType,
    kdfConfig: KdfConfig,
    protectedKeyCs?: EncString
  ) => Promise<UserSymKey>;
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
  getEncKey: (key?: SymmetricCryptoKey) => Promise<SymmetricCryptoKey>;
  hasEncKey: () => Promise<boolean>;
  clearEncKey: (memoryOnly?: boolean, userId?: string) => Promise<any>;
  toggleKey: () => Promise<any>;
}

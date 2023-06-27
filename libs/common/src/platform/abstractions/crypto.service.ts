import { ProfileOrganizationResponse } from "../../admin-console/models/response/profile-organization.response";
import { ProfileProviderOrganizationResponse } from "../../admin-console/models/response/profile-provider-organization.response";
import { ProfileProviderResponse } from "../../admin-console/models/response/profile-provider.response";
import { KdfConfig } from "../../auth/models/domain/kdf-config";
import { KeySuffixOptions, KdfType, HashPurpose } from "../../enums";
import { EncArrayBuffer } from "../models/domain/enc-array-buffer";
import { EncString } from "../models/domain/enc-string";
import {
  MasterKey,
  OrgKey,
  PinKey,
  ProviderKey,
  SymmetricCryptoKey,
  UserKey,
} from "../models/domain/symmetric-crypto-key";

export abstract class CryptoService {
  /**
   * Use for encryption/decryption of data in order to support legacy
   * encryption models. It will return the user key if available,
   * if not it will return the master key.
   */
  getKeyForUserEncryption: (key?: SymmetricCryptoKey) => Promise<SymmetricCryptoKey>;

  /**
   * Sets the provided user key and stores
   * any other necessary versions, such as biometrics
   * @param key The user key to set
   * @param userId The desired user
   */
  setUserKey: (key: UserKey) => Promise<void>;
  /**
   * Gets the user key from memory and sets it again,
   * kicking off a refresh of any additional keys that are needed.
   */
  toggleKey: () => Promise<void>;
  /**
   * Retrieves the user key
   * @param keySuffix The desired version of the user's key to retrieve
   * from storage if it is not available in memory
   * @param userId The desired user
   * @returns The user key
   */
  getUserKeyFromMemory: (userId?: string) => Promise<UserKey>;
  /**
   * Retrieves the user key from storage
   * @param keySuffix The desired version of the user's key to retrieve
   * @param userId The desired user
   * @returns The user key
   */
  getUserKeyFromStorage: (
    keySuffix: KeySuffixOptions.Auto | KeySuffixOptions.Biometric,
    userId?: string
  ) => Promise<UserKey>;
  /**
   * @returns True if any version of the user key is available
   */
  hasUserKey: () => Promise<boolean>;
  /**
   * @param userId The desired user
   * @returns True if the user key is set in memory
   */
  hasUserKeyInMemory: (userId?: string) => Promise<boolean>;
  /**
   * @param keySuffix The desired version of the user's key to check
   * @param userId The desired user
   * @returns True if the provided version of the user key is stored
   */
  hasUserKeyStored: (
    keySuffix?: KeySuffixOptions.Auto | KeySuffixOptions.Biometric,
    userId?: string
  ) => Promise<boolean>;
  /**
   * Generates a new user key
   * @param masterKey The user's master key
   * @returns A new user key and the master key protected version of it
   */
  makeUserKey: (key: MasterKey) => Promise<[UserKey, EncString]>;
  /**
   * Clears the user key
   * @param clearStoredKeys Clears all stored versions of the user keys as well,
   * such as the biometrics key
   * @param userId The desired user
   */
  clearUserKey: (clearSecretStorage?: boolean, userId?: string) => Promise<void>;
  /**
   * Clears the user's stored version of the user key
   * @param keySuffix The desired version of the key to clear
   * @param userId The desired user
   */
  clearStoredUserKey: (keySuffix: KeySuffixOptions, userId?: string) => Promise<void>;
  /**
   * Stores the master key encrypted user key
   * @param userKeyMasterKey The master key encrypted user key to set
   * @param userId The desired user
   */
  setUserKeyMasterKey: (UserKeyMasterKey: string, userId?: string) => Promise<void>;
  /**
   * Sets the user's master key
   * @param key The user's master key to set
   * @param userId The desired user
   */
  setMasterKey: (key: MasterKey, userId?: string) => Promise<void>;
  /**
   * @param userId The desired user
   * @returns The user's master key
   */
  getMasterKey: (userId?: string) => Promise<MasterKey>;
  /**
   * Generates a master key from the provided password
   * @param password The user's master password
   * @param email The user's email
   * @param kdf The user's selected key derivation function to use
   * @param KdfConfig The user's key derivation function configuration
   * @returns A master key derived from the provided password
   */
  makeMasterKey: (
    password: string,
    email: string,
    kdf: KdfType,
    KdfConfig: KdfConfig
  ) => Promise<MasterKey>;
  /**
   * Clears the user's master key
   * @param userId The desired user
   */
  clearMasterKey: (userId?: string) => Promise<void>;
  /**
   * Encrypts the existing (or provided) user key with the
   * provided master key
   * @param masterKey The user's master key
   * @param userKey The user key
   * @returns The user key and the master key protected version of it
   */
  encryptUserKeyWithMasterKey: (
    masterKey: MasterKey,
    userKey?: UserKey
  ) => Promise<[UserKey, EncString]>;
  /**
   * Decrypts the user key with the provided master key
   * @param masterKey The user's master key
   * @param userKey The user's encrypted symmetric key
   * @param userId The desired user
   * @returns The user key
   */
  decryptUserKeyWithMasterKey: (
    masterKey: MasterKey,
    userKey?: EncString,
    userId?: string
  ) => Promise<UserKey>;
  /**
   * Creates a master password hash from the user's master password. Can
   * be used for local authentication or for server authentication depending
   * on the hashPurpose provided.
   * @param password The user's master password
   * @param key The user's master key
   * @param hashPurpose The iterations to use for the hash
   * @returns The user's master password hash
   */
  hashPassword: (password: string, key: MasterKey, hashPurpose?: HashPurpose) => Promise<string>;
  /**
   * Sets the user's key hash
   * @param keyHash The user's key hash to set
   */
  setKeyHash: (keyHash: string) => Promise<void>;
  /**
   * @returns The user's key hash
   */
  getKeyHash: () => Promise<string>;
  /**
   * Clears the user's stored key hash
   * @param userId The desired user
   */
  clearKeyHash: () => Promise<void>;
  /**
   * Compares the provided master password to the stored key hash and updates
   * if the stored hash is outdated
   * @param masterPassword The user's master password
   * @param key The user's master key
   * @returns True if the provided master password matches either the stored
   * key hash
   */
  compareAndUpdateKeyHash: (masterPassword: string, key: MasterKey) => Promise<boolean>;
  /**
   * Stores the encrypted organization keys and clears any decrypted
   * organization keys currently in memory
   * @param orgs The organizations to set keys for
   * @param providerOrgs The provider organizations to set keys for
   */
  setOrgKeys: (
    orgs: ProfileOrganizationResponse[],
    providerOrgs: ProfileProviderOrganizationResponse[]
  ) => Promise<void>;
  /**
   * Returns the organization's symmetric key
   * @param orgId The desired organization
   * @returns The organization's symmetric key
   */
  getOrgKey: (orgId: string) => Promise<OrgKey>;
  /**
   * @returns A map of the organization Ids to their symmetric keys
   */
  getOrgKeys: () => Promise<Map<string, SymmetricCryptoKey>>;
  /**
   * Uses the org key to derive a new symmetric key for encrypting data
   * @param orgKey The organization's symmetric key
   */
  makeDataEncKey: <T extends UserKey | OrgKey>(key: T) => Promise<[SymmetricCryptoKey, EncString]>;
  /**
   * Clears the user's stored organization keys
   * @param memoryOnly Clear only the in-memory keys
   * @param userId The desired user
   */
  clearOrgKeys: (memoryOnly?: boolean, userId?: string) => Promise<void>;
  /**
   * Stores the encrypted provider keys and clears any decrypted
   * provider keys currently in memory
   * @param providers The providers to set keys for
   */
  setProviderKeys: (orgs: ProfileProviderResponse[]) => Promise<void>;
  /**
   * @param providerId The desired provider
   * @returns The provider's symmetric key
   */
  getProviderKey: (providerId: string) => Promise<ProviderKey>;
  /**
   * @returns A map of the provider Ids to their symmetric keys
   */
  getProviderKeys: () => Promise<Map<string, ProviderKey>>;
  /**
   * @param memoryOnly Clear only the in-memory keys
   * @param userId The desired user
   */
  clearProviderKeys: (memoryOnly?: boolean) => Promise<void>;
  /**
   * Returns the public key from memory. If not available, extracts it
   * from the private key and stores it in memory
   * @returns The user's public key
   */
  getPublicKey: () => Promise<ArrayBuffer>;
  /**
   * Creates a new 64 byte key and encrypts it with the user's public key
   * @returns The new encrypted share key and the decrypted key itself
   */
  makeOrgKey: <T extends OrgKey | ProviderKey>() => Promise<[EncString, T]>;
  /**
   * Sets the the user's encrypted private key in storage and
   * clears the decrypted private key from memory
   * Note: does not clear the private key if null is provided
   * @param encPrivateKey An encrypted private key
   */
  setPrivateKey: (encPrivateKey: string) => Promise<void>;
  /**
   * Returns the private key from memory. If not available, decrypts it
   * from storage and stores it in memory
   * @returns The user's private key
   */
  getPrivateKey: () => Promise<ArrayBuffer>;
  /**
   * Generates a fingerprint phrase for the user based on their public key
   * @param fingerprintMaterial Fingerprint material
   * @param publicKey The user's public key
   * @returns The user's fingerprint phrase
   */
  getFingerprint: (fingerprintMaterial: string, publicKey?: ArrayBuffer) => Promise<string[]>;
  /**
   * Generates a new keypair
   * @param key A key to encrypt the private key with. If not provided,
   * defaults to the user key
   * @returns A new keypair: [publicKey in Base64, encrypted privateKey]
   */
  makeKeyPair: (key?: SymmetricCryptoKey) => Promise<[string, EncString]>;
  /**
   * Clears the user's key pair
   * @param memoryOnly Clear only the in-memory keys
   * @param userId The desired user
   */
  clearKeyPair: (memoryOnly?: boolean, userId?: string) => Promise<void[]>;
  /**
   * @param pin The user's pin
   * @param salt The user's salt
   * @param kdf The user's kdf
   * @param kdfConfig The user's kdf config
   * @returns A key derived from the user's pin
   */
  makePinKey: (pin: string, salt: string, kdf: KdfType, kdfConfig: KdfConfig) => Promise<PinKey>;
  /**
   * Clears the user's pin protected user key
   * @param userId The desired user
   */
  clearPinProtectedKey: (userId?: string) => Promise<void>;
  /**
   * Clears the user's old pin keys from storage
   * @param userId The desired user
   */
  clearOldPinKeys: (userId?: string) => Promise<void>;
  /**
   * Decrypts the user key with their pin
   * @param pin The user's PIN
   * @param salt The user's salt
   * @param kdf The user's KDF
   * @param kdfConfig The user's KDF config
   * @param pinProtectedUserKey The user's PIN protected symmetric key, if not provided
   * it will be retrieved from storage
   * @returns The decrypted user key
   */
  decryptUserKeyWithPin: (
    pin: string,
    salt: string,
    kdf: KdfType,
    kdfConfig: KdfConfig,
    protectedKeyCs?: EncString
  ) => Promise<UserKey>;
  /**
   * @param keyMaterial The key material to derive the send key from
   * @returns A new send key
   */
  makeSendKey: (keyMaterial: ArrayBuffer) => Promise<SymmetricCryptoKey>;
  /**
   * Clears all of the user's keys from storage
   * @param userId The user's Id
   */
  clearKeys: (userId?: string) => Promise<any>;
  /**
   * RSA encrypts a value.
   * @param data The data to encrypt
   * @param publicKey The public key to use for encryption, if not provided, the user's public key will be used
   * @returns The encrypted data
   */
  rsaEncrypt: (data: ArrayBuffer, publicKey?: ArrayBuffer) => Promise<EncString>;
  /**
   * Decrypts a value using RSA.
   * @param encValue The encrypted value to decrypt
   * @param privateKeyValue The private key to use for decryption
   * @returns The decrypted value
   */
  rsaDecrypt: (encValue: string, privateKeyValue?: ArrayBuffer) => Promise<ArrayBuffer>;
  randomNumber: (min: number, max: number) => Promise<number>;

  /**
   * @deprecated Left for migration purposes. Use decryptUserKeyWithPin instead.
   */
  decryptMasterKeyWithPin: (
    pin: string,
    salt: string,
    kdf: KdfType,
    kdfConfig: KdfConfig,
    protectedKeyCs?: EncString
  ) => Promise<MasterKey>;
  /**
   * @deprecated July 25 2022: Get the key you need from CryptoService (getKeyForUserEncryption or getOrgKey)
   * and then call encryptService.encrypt
   */
  encrypt: (plainValue: string | ArrayBuffer, key?: SymmetricCryptoKey) => Promise<EncString>;
  /**
   * @deprecated July 25 2022: Get the key you need from CryptoService (getKeyForUserEncryption or getOrgKey)
   * and then call encryptService.encryptToBytes
   */
  encryptToBytes: (plainValue: ArrayBuffer, key?: SymmetricCryptoKey) => Promise<EncArrayBuffer>;
  /**
   * @deprecated July 25 2022: Get the key you need from CryptoService (getKeyForUserEncryption or getOrgKey)
   * and then call encryptService.decryptToBytes
   */
  decryptToBytes: (encString: EncString, key?: SymmetricCryptoKey) => Promise<ArrayBuffer>;
  /**
   * @deprecated July 25 2022: Get the key you need from CryptoService (getKeyForUserEncryption or getOrgKey)
   * and then call encryptService.decryptToUtf8
   */
  decryptToUtf8: (encString: EncString, key?: SymmetricCryptoKey) => Promise<string>;
  /**
   * @deprecated July 25 2022: Get the key you need from CryptoService (getKeyForUserEncryption or getOrgKey)
   * and then call encryptService.decryptToBytes
   */
  decryptFromBytes: (encBuffer: EncArrayBuffer, key: SymmetricCryptoKey) => Promise<ArrayBuffer>;
}

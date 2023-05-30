import * as bigInt from "big-integer";

import { EncryptedOrganizationKeyData } from "../../admin-console/models/data/encrypted-organization-key.data";
import { BaseEncryptedOrganizationKey } from "../../admin-console/models/domain/encrypted-organization-key";
import { ProfileOrganizationResponse } from "../../admin-console/models/response/profile-organization.response";
import { ProfileProviderOrganizationResponse } from "../../admin-console/models/response/profile-provider-organization.response";
import { ProfileProviderResponse } from "../../admin-console/models/response/profile-provider.response";
import { KdfConfig } from "../../auth/models/domain/kdf-config";
import {
  KeySuffixOptions,
  HashPurpose,
  KdfType,
  DEFAULT_ARGON2_ITERATIONS,
  DEFAULT_ARGON2_MEMORY,
  DEFAULT_ARGON2_PARALLELISM,
  EncryptionType,
} from "../../enums";
import { Utils } from "../../platform/misc/utils";
import { CryptoFunctionService } from "../abstractions/crypto-function.service";
import { CryptoService as CryptoServiceAbstraction } from "../abstractions/crypto.service";
import { EncryptService } from "../abstractions/encrypt.service";
import { LogService } from "../abstractions/log.service";
import { PlatformUtilsService } from "../abstractions/platform-utils.service";
import { StateService } from "../abstractions/state.service";
import { sequentialize } from "../misc/sequentialize";
import { EFFLongWordList } from "../misc/wordlist";
import { EncArrayBuffer } from "../models/domain/enc-array-buffer";
import { EncString } from "../models/domain/enc-string";
import {
  MasterKey,
  PinKey,
  SymmetricCryptoKey,
  UserSymKey,
} from "../models/domain/symmetric-crypto-key";

export class CryptoService implements CryptoServiceAbstraction {
  constructor(
    protected cryptoFunctionService: CryptoFunctionService,
    protected encryptService: EncryptService,
    protected platformUtilService: PlatformUtilsService,
    protected logService: LogService,
    protected stateService: StateService
  ) {}

  /**
   * Use for encryption/decryption of data in order to support legacy
   * encryption models. It will return the user symmetric key if available,
   * if not it will return the master key.
   */
  async getKeyForUserEncryption(): Promise<SymmetricCryptoKey> {
    const userKey = await this.getUserKeyFromMemory();
    if (userKey != null) {
      return userKey;
    }

    // Legacy support: encryption used to be done with the master key (derived from master password).
    // Users who have not migrated will have a null user key and must use the master key instead.
    return await this.stateService.getCryptoMasterKey();
  }

  /**
   * Sets the provided user symmetric key and stores
   * any other necessary versions, such as biometrics
   * @param key The user symmetric key to set
   * @param userId The desired user
   */
  async setUserKey(key: UserSymKey, userId?: string): Promise<void> {
    await this.stateService.setUserSymKey(key, { userId: userId });
    // TODO(Jake): Should we include additional keys here? When we set the memory key from storage,
    // it will reset the keys in storage as well
    await this.storeAdditionalKeys(key, userId);
  }

  /**
   * Retrieves the user's symmetric key
   * @param keySuffix The desired version of the user's key to retrieve
   * from storage if it is not available in memory
   * @param userId The desired user
   * @returns The user's symmetric key
   */
  async getUserKeyFromMemory(userId?: string): Promise<UserSymKey> {
    return await this.stateService.getUserSymKey({ userId: userId });
  }

  /**
   * Retrieves the user's symmetric key from storage
   * @param keySuffix The desired version of the user's key to retrieve
   * @param userId The desired user
   * @returns The user's symmetric key
   */
  async getUserKeyFromStorage(keySuffix: KeySuffixOptions, userId?: string): Promise<UserSymKey> {
    const userKey = await this.retrieveUserKeyFromStorage(keySuffix, userId);
    if (userKey != null) {
      if (!(await this.validateUserKey(userKey))) {
        this.logService.warning("Wrong key, throwing away stored key");
        await this.clearStoredUserKeys(userId);
        return null;
      }

      return userKey;
    }
    return null;
  }

  /**
   * @returns True if any version of the user symmetric key is available
   */
  async hasUserKey(): Promise<boolean> {
    return (
      (await this.hasUserKeyInMemory()) ||
      (await this.hasUserKeyStored(KeySuffixOptions.Auto)) ||
      (await this.hasUserKeyStored(KeySuffixOptions.Biometric))
    );
  }

  /**
   * @param userId The desired user
   * @returns True if the user symmetric key is set in memory
   */
  async hasUserKeyInMemory(userId?: string): Promise<boolean> {
    return (await this.stateService.getUserSymKey({ userId: userId })) != null;
  }

  /**
   * @param keySuffix The desired version of the user's key to check
   * @param userId The desired user
   * @returns True if the provided version of the user symmetric key is stored
   */
  async hasUserKeyStored(keySuffix: KeySuffixOptions, userId?: string): Promise<boolean> {
    switch (keySuffix) {
      case KeySuffixOptions.Auto:
        return (await this.stateService.getUserSymKeyAuto({ userId: userId })) != null;
      case KeySuffixOptions.Biometric:
        return (await this.stateService.hasUserSymKeyBiometric({ userId: userId })) === true;
      default:
        return false;
    }
  }

  /**
   * Generates a new user symmetric key
   * @param masterKey The user's master key
   * @returns A new user symmetric key and the master key protected version of it
   */
  async makeUserSymKey(masterKey: MasterKey): Promise<[UserSymKey, EncString]> {
    masterKey ||= await this.getMasterKey();
    if (masterKey == null) {
      throw new Error("No Master Key found.");
    }

    const newUserSymKey = await this.cryptoFunctionService.randomBytes(64);
    return this.buildProtectedUserSymKey(masterKey, newUserSymKey);
  }

  /**
   * Clears the user's symmetric key
   * @param clearSecretStorage Clears all stored versions of the user keys as well,
   * such as the biometrics key
   * @param userId The desired user
   */
  async clearUserKey(clearSecretStorage = true, userId?: string): Promise<void> {
    await this.stateService.setUserSymKey(null, { userId: userId });
    if (clearSecretStorage) {
      await this.clearStoredUserKeys(userId);
    }
  }

  /**
   * Clears the specified version of the user's symmetric key from storage
   * @param keySuffix The desired version of the user's key to clear
   */
  async clearUserKeyFromStorage(keySuffix: KeySuffixOptions): Promise<void> {
    keySuffix === KeySuffixOptions.Auto
      ? await this.stateService.setUserSymKeyAuto(null)
      : await this.stateService.setUserSymKeyBiometric(null);
  }

  /**
   * Stores the master key encrypted user symmetric key
   * @param userSymKeyMasterKey The master key encrypted user symmetric key to set
   * @param userId The desired user
   */
  async setUserSymKeyMasterKey(userSymKeyMasterKey: string, userId?: string): Promise<void> {
    // TODO(Jake): is this the best way to handle this from the identity token?
    await this.stateService.setUserSymKeyMasterKey(userSymKeyMasterKey, { userId: userId });
  }

  /**
   * Sets the user's master key
   * @param key The user's master key to set
   * @param userId The desired user
   */
  async setMasterKey(key: MasterKey, userId?: string): Promise<void> {
    await this.stateService.setMasterKey(key, { userId: userId });
  }

  /**
   * @param userId The desired user
   * @returns The user's master key
   */
  async getMasterKey(userId?: string): Promise<MasterKey> {
    return await this.stateService.getMasterKey({ userId: userId });
  }

  /**
   * Generates a master key from the provided password
   * @param password The user's master password
   * @param email The user's email
   * @param kdf The user's selected key derivation function to use
   * @param KdfConfig The user's key derivation function configuration
   * @returns A master key derived from the provided password
   */
  async makeMasterKey(
    password: string,
    email: string,
    kdf: KdfType,
    KdfConfig: KdfConfig
  ): Promise<MasterKey> {
    return (await this.makeKey(password, email, kdf, KdfConfig)) as MasterKey;
  }

  /**
   * Clears the user's master key
   * @param userId The desired user
   */
  async clearMasterKey(userId?: string): Promise<void> {
    await this.stateService.setMasterKey(null, { userId: userId });
  }

  /**
   * Encrypts the existing (or provided) user symmetric key with the
   * provided master key
   * @param masterKey The user's master key
   * @param userSymKey The user's symmetric key
   * @returns The user's symmetric key and the master key protected version of it
   */
  async encryptUserSymKeyWithMasterKey(
    masterKey: MasterKey,
    userSymKey?: UserSymKey
  ): Promise<[UserSymKey, EncString]> {
    userSymKey ||= await this.getUserKeyFromMemory();
    return this.buildProtectedUserSymKey(masterKey, userSymKey.key);
  }

  /**
   * Decrypts the user symmetric key with the provided master key
   * @param masterKey The user's master key
   * @param userId The desired user
   * @returns The user's symmetric key
   */
  async decryptUserSymKeyWithMasterKey(masterKey: MasterKey, userId?: string): Promise<UserSymKey> {
    masterKey ||= await this.getMasterKey();
    if (masterKey == null) {
      throw new Error("No Master Key found.");
    }

    // TODO(Jake): Do we need to let this be passed in as well?
    const userSymKeyMasterKey = await this.stateService.getUserSymKeyMasterKey({ userId: userId });
    if (userSymKeyMasterKey == null) {
      throw new Error("No User Key found.");
    }

    let decUserKey: ArrayBuffer;
    const encUserKey = new EncString(userSymKeyMasterKey);
    if (encUserKey.encryptionType === EncryptionType.AesCbc256_B64) {
      decUserKey = await this.decryptToBytes(encUserKey, masterKey);
    } else if (encUserKey.encryptionType === EncryptionType.AesCbc256_HmacSha256_B64) {
      const newKey = await this.stretchKey(masterKey);
      decUserKey = await this.decryptToBytes(encUserKey, newKey);
    } else {
      throw new Error("Unsupported encryption type.");
    }
    if (decUserKey == null) {
      return null;
    }

    // TODO(Jake): Do we want to set the user key here?
    return new SymmetricCryptoKey(decUserKey) as UserSymKey;
  }

  /**
   * Creates a master password hash from the user's master password. Can
   * be used for local authentication or for server authentication depending
   * on the hashPurpose provided.
   * @param password The user's master password
   * @param key The user's master key
   * @param hashPurpose The iterations to use for the hash
   * @returns The user's master password hash
   */
  async hashPassword(password: string, key: MasterKey, hashPurpose?: HashPurpose): Promise<string> {
    key ||= await this.getMasterKey();

    if (password == null || key == null) {
      throw new Error("Invalid parameters.");
    }

    const iterations = hashPurpose === HashPurpose.LocalAuthorization ? 2 : 1;
    const hash = await this.cryptoFunctionService.pbkdf2(key.key, password, "sha256", iterations);
    return Utils.fromBufferToB64(hash);
  }

  /**
   * Sets the user's key hash
   * @param keyHash The user's key hash to set
   */
  async setKeyHash(keyHash: string): Promise<void> {
    await this.stateService.setKeyHash(keyHash);
  }

  /**
   * @returns The user's key hash
   */
  async getKeyHash(): Promise<string> {
    return await this.stateService.getKeyHash();
  }

  /**
   * Clears the user's stored key hash
   * @param userId The desired user
   */
  async clearKeyHash(userId?: string): Promise<void> {
    return await this.stateService.setKeyHash(null, { userId: userId });
  }

  /**
   * Compares the provided master password to the stored key hash and updates
   * if the stored hash is outdated
   * @param masterPassword The user's master password
   * @param key The user's master key
   * @returns True if the provided master password matches either the stored
   * key hash
   */
  async compareAndUpdateKeyHash(masterPassword: string, key: MasterKey): Promise<boolean> {
    const storedKeyHash = await this.getKeyHash();
    if (masterPassword != null && storedKeyHash != null) {
      const localKeyHash = await this.hashPassword(
        masterPassword,
        key,
        HashPurpose.LocalAuthorization
      );
      if (localKeyHash != null && storedKeyHash === localKeyHash) {
        return true;
      }

      // TODO: remove serverKeyHash check in 1-2 releases after everyone's keyHash has been updated
      const serverKeyHash = await this.hashPassword(
        masterPassword,
        key,
        HashPurpose.ServerAuthorization
      );
      if (serverKeyHash != null && storedKeyHash === serverKeyHash) {
        await this.setKeyHash(localKeyHash);
        return true;
      }
    }

    return false;
  }

  /**
   * Stores the encrypted organization keys and clears any decrypted
   * organization keys currently in memory
   * @param orgs The organizations to set keys for
   * @param providerOrgs The provider organizations to set keys for
   */
  async setOrgKeys(
    orgs: ProfileOrganizationResponse[] = [],
    providerOrgs: ProfileProviderOrganizationResponse[] = []
  ): Promise<void> {
    const encOrgKeyData: { [orgId: string]: EncryptedOrganizationKeyData } = {};

    orgs.forEach((org) => {
      encOrgKeyData[org.id] = {
        type: "organization",
        key: org.key,
      };
    });

    providerOrgs.forEach((org) => {
      encOrgKeyData[org.id] = {
        type: "provider",
        providerId: org.providerId,
        key: org.key,
      };
    });

    await this.stateService.setDecryptedOrganizationKeys(null);
    return await this.stateService.setEncryptedOrganizationKeys(encOrgKeyData);
  }

  /**
   * Returns the organization's symmetric key
   * @param orgId The desired organization
   * @returns The organization's symmetric key
   */
  async getOrgKey(orgId: string): Promise<SymmetricCryptoKey> {
    if (orgId == null) {
      return null;
    }

    const orgKeys = await this.getOrgKeys();
    if (orgKeys == null || !orgKeys.has(orgId)) {
      return null;
    }

    return orgKeys.get(orgId);
  }

  /**
   * @returns A map of the organization Ids to their symmetric keys
   */
  @sequentialize(() => "getOrgKeys")
  async getOrgKeys(): Promise<Map<string, SymmetricCryptoKey>> {
    const result: Map<string, SymmetricCryptoKey> = new Map<string, SymmetricCryptoKey>();
    const decryptedOrganizationKeys = await this.stateService.getDecryptedOrganizationKeys();
    if (decryptedOrganizationKeys != null && decryptedOrganizationKeys.size > 0) {
      return decryptedOrganizationKeys;
    }

    const encOrgKeyData = await this.stateService.getEncryptedOrganizationKeys();
    if (encOrgKeyData == null) {
      return null;
    }

    let setKey = false;

    for (const orgId of Object.keys(encOrgKeyData)) {
      if (result.has(orgId)) {
        continue;
      }

      const encOrgKey = BaseEncryptedOrganizationKey.fromData(encOrgKeyData[orgId]);
      const decOrgKey = await encOrgKey.decrypt(this);
      result.set(orgId, decOrgKey);

      setKey = true;
    }

    if (setKey) {
      await this.stateService.setDecryptedOrganizationKeys(result);
    }

    return result;
  }

  /**
   * Clears the user's stored organization keys
   * @param memoryOnly Clear only the in-memory keys
   * @param userId The desired user
   */
  async clearOrgKeys(memoryOnly?: boolean, userId?: string): Promise<void> {
    await this.stateService.setDecryptedOrganizationKeys(null, { userId: userId });
    if (!memoryOnly) {
      await this.stateService.setEncryptedOrganizationKeys(null, { userId: userId });
    }
  }

  /**
   * Stores the encrypted provider keys and clears any decrypted
   * provider keys currently in memory
   * @param providers The providers to set keys for
   */
  async setProviderKeys(providers: ProfileProviderResponse[]): Promise<void> {
    const providerKeys: any = {};
    providers.forEach((provider) => {
      providerKeys[provider.id] = provider.key;
    });

    await this.stateService.setDecryptedProviderKeys(null);
    return await this.stateService.setEncryptedProviderKeys(providerKeys);
  }

  /**
   * @param providerId The desired provider
   * @returns The provider's symmetric key
   */
  async getProviderKey(providerId: string): Promise<SymmetricCryptoKey> {
    if (providerId == null) {
      return null;
    }

    const providerKeys = await this.getProviderKeys();
    if (providerKeys == null || !providerKeys.has(providerId)) {
      return null;
    }

    return providerKeys.get(providerId);
  }

  /**
   * @returns A map of the provider Ids to their symmetric keys
   */
  @sequentialize(() => "getProviderKeys")
  async getProviderKeys(): Promise<Map<string, SymmetricCryptoKey>> {
    const providerKeys: Map<string, SymmetricCryptoKey> = new Map<string, SymmetricCryptoKey>();
    const decryptedProviderKeys = await this.stateService.getDecryptedProviderKeys();
    if (decryptedProviderKeys != null && decryptedProviderKeys.size > 0) {
      return decryptedProviderKeys;
    }

    const encProviderKeys = await this.stateService.getEncryptedProviderKeys();
    if (encProviderKeys == null) {
      return null;
    }

    let setKey = false;

    for (const orgId in encProviderKeys) {
      // eslint-disable-next-line
      if (!encProviderKeys.hasOwnProperty(orgId)) {
        continue;
      }

      const decValue = await this.rsaDecrypt(encProviderKeys[orgId]);
      providerKeys.set(orgId, new SymmetricCryptoKey(decValue));
      setKey = true;
    }

    if (setKey) {
      await this.stateService.setDecryptedProviderKeys(providerKeys);
    }

    return providerKeys;
  }

  /**
   * @param memoryOnly Clear only the in-memory keys
   * @param userId The desired user
   */
  async clearProviderKeys(memoryOnly?: boolean, userId?: string): Promise<void> {
    await this.stateService.setDecryptedProviderKeys(null, { userId: userId });
    if (!memoryOnly) {
      await this.stateService.setEncryptedProviderKeys(null, { userId: userId });
    }
  }

  /**
   * Returns the public key from memory. If not available, extracts it
   * from the private key and stores it in memory
   * @returns The user's public key
   */
  async getPublicKey(): Promise<ArrayBuffer> {
    const inMemoryPublicKey = await this.stateService.getPublicKey();
    if (inMemoryPublicKey != null) {
      return inMemoryPublicKey;
    }

    const privateKey = await this.getPrivateKey();
    if (privateKey == null) {
      return null;
    }

    const publicKey = await this.cryptoFunctionService.rsaExtractPublicKey(privateKey);
    await this.stateService.setPublicKey(publicKey);
    return publicKey;
  }

  /**
   * Create's a new 64 byte key and encrypts it with the user's public key
   * @returns The new encrypted share key and the decrypted key itself
   */
  async makeShareKey(): Promise<[EncString, SymmetricCryptoKey]> {
    const shareKey = await this.cryptoFunctionService.randomBytes(64);
    const publicKey = await this.getPublicKey();
    const encShareKey = await this.rsaEncrypt(shareKey, publicKey);
    return [encShareKey, new SymmetricCryptoKey(shareKey)];
  }

  /**
   * Sets the the user's encrypted private key in storage and
   * clears the decrypted private key from memory
   * Note: does not clear the private key if null is provided
   * @param encPrivateKey An encrypted private key
   */
  async setPrivateKey(encPrivateKey: string): Promise<void> {
    if (encPrivateKey == null) {
      return;
    }

    await this.stateService.setDecryptedPrivateKey(null);
    await this.stateService.setEncryptedPrivateKey(encPrivateKey);
  }

  /**
   * Returns the private key from memory. If not available, decrypts it
   * from storage and stores it in memory
   * @returns The user's private key
   */
  async getPrivateKey(): Promise<ArrayBuffer> {
    const decryptedPrivateKey = await this.stateService.getDecryptedPrivateKey();
    if (decryptedPrivateKey != null) {
      return decryptedPrivateKey;
    }

    const encPrivateKey = await this.stateService.getEncryptedPrivateKey();
    if (encPrivateKey == null) {
      return null;
    }

    const privateKey = await this.decryptToBytes(new EncString(encPrivateKey), null);
    await this.stateService.setDecryptedPrivateKey(privateKey);
    return privateKey;
  }

  /**
   * Generates a fingerprint phrase for the user based on their public key
   * @param userId The user's Id
   * @param publicKey The user's public key
   * @returns The user's fingerprint phrase
   */
  async getFingerprint(fingerprintMaterial: string, publicKey?: ArrayBuffer): Promise<string[]> {
    if (publicKey == null) {
      publicKey = await this.getPublicKey();
    }
    if (publicKey === null) {
      throw new Error("No public key available.");
    }
    const keyFingerprint = await this.cryptoFunctionService.hash(publicKey, "sha256");
    const userFingerprint = await this.cryptoFunctionService.hkdfExpand(
      keyFingerprint,
      fingerprintMaterial,
      32,
      "sha256"
    );
    return this.hashPhrase(userFingerprint);
  }

  /**
   * Generates a new keypair
   * @param key A key to encrypt the private key with. If not provided,
   * defaults to the user's symmetric key
   * @returns A new keypair: [publicKey in Base64, encrypted privateKey]
   */
  async makeKeyPair(key?: SymmetricCryptoKey): Promise<[string, EncString]> {
    key ||= await this.getUserKeyFromMemory();

    const keyPair = await this.cryptoFunctionService.rsaGenerateKeyPair(2048);
    const publicB64 = Utils.fromBufferToB64(keyPair[0]);
    const privateEnc = await this.encrypt(keyPair[1], key);
    return [publicB64, privateEnc];
  }

  /**
   * Clears the user's key pair
   * @param memoryOnly Clear only the in-memory keys
   * @param userId The desired user
   */
  async clearKeyPair(memoryOnly?: boolean, userId?: string): Promise<void[]> {
    const keysToClear: Promise<void>[] = [
      this.stateService.setDecryptedPrivateKey(null, { userId: userId }),
      this.stateService.setPublicKey(null, { userId: userId }),
    ];
    if (!memoryOnly) {
      keysToClear.push(this.stateService.setEncryptedPrivateKey(null, { userId: userId }));
    }
    return Promise.all(keysToClear);
  }

  /**
   * @param pin The user's pin
   * @param salt The user's salt
   * @param kdf The user's kdf
   * @param kdfConfig The user's kdf config
   * @returns A key derived from the user's pin
   */
  async makePinKey(pin: string, salt: string, kdf: KdfType, kdfConfig: KdfConfig): Promise<PinKey> {
    const pinKey = await this.makeKey(pin, salt, kdf, kdfConfig);
    return (await this.stretchKey(pinKey)) as PinKey;
  }

  /**
   * Clears the user's pin protected user symmetric key
   * @param userId The desired user
   */
  async clearPinProtectedKey(userId?: string): Promise<void> {
    return await this.stateService.setEncryptedPinProtected(null, { userId: userId });
  }

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
  async decryptUserSymKeyWithPin(
    pin: string,
    salt: string,
    kdf: KdfType,
    kdfConfig: KdfConfig,
    pinProtectedUserSymKey: EncString = null
  ): Promise<UserSymKey> {
    if (pinProtectedUserSymKey == null) {
      const pinProtectedUserSymKeyString = await this.stateService.getEncryptedPinProtected();
      if (pinProtectedUserSymKeyString == null) {
        throw new Error("No PIN protected key found.");
      }
      pinProtectedUserSymKey = new EncString(pinProtectedUserSymKeyString);
    }
    const pinKey = await this.makePinKey(pin, salt, kdf, kdfConfig);
    const userSymKey = await this.decryptToBytes(pinProtectedUserSymKey, pinKey);
    return new SymmetricCryptoKey(userSymKey) as UserSymKey;
  }

  /**
   * @param keyMaterial The key material to derive the send key from
   * @returns A new send key
   */
  async makeSendKey(keyMaterial: ArrayBuffer): Promise<SymmetricCryptoKey> {
    const sendKey = await this.cryptoFunctionService.hkdf(
      keyMaterial,
      "bitwarden-send",
      "send",
      64,
      "sha256"
    );
    return new SymmetricCryptoKey(sendKey);
  }

  /**
   * Clears all of the user's keys from storage
   * @param userId The user's Id
   */
  async clearKeys(userId?: string): Promise<any> {
    await this.clearUserKey(true, userId);
    await this.clearKeyHash(userId);
    await this.clearOrgKeys(false, userId);
    await this.clearProviderKeys(false, userId);
    await this.clearKeyPair(false, userId);
    await this.clearPinProtectedKey(userId);
  }

  /**
   * RSA encrypts a value.
   * @param data The data to encrypt
   * @param publicKey The public key to use for encryption, if not provided, the user's public key will be used
   * @returns The encrypted data
   */
  async rsaEncrypt(data: ArrayBuffer, publicKey?: ArrayBuffer): Promise<EncString> {
    if (publicKey == null) {
      publicKey = await this.getPublicKey();
    }
    if (publicKey == null) {
      throw new Error("Public key unavailable.");
    }

    const encBytes = await this.cryptoFunctionService.rsaEncrypt(data, publicKey, "sha1");
    return new EncString(EncryptionType.Rsa2048_OaepSha1_B64, Utils.fromBufferToB64(encBytes));
  }

  /**
   * Decrypts a value using RSA.
   * @param encValue The encrypted value to decrypt
   * @param privateKeyValue The private key to use for decryption
   * @returns The decrypted value
   */
  async rsaDecrypt(encValue: string, privateKeyValue?: ArrayBuffer): Promise<ArrayBuffer> {
    const headerPieces = encValue.split(".");
    let encType: EncryptionType = null;
    let encPieces: string[];

    if (headerPieces.length === 1) {
      encType = EncryptionType.Rsa2048_OaepSha256_B64;
      encPieces = [headerPieces[0]];
    } else if (headerPieces.length === 2) {
      try {
        encType = parseInt(headerPieces[0], null);
        encPieces = headerPieces[1].split("|");
      } catch (e) {
        this.logService.error(e);
      }
    }

    switch (encType) {
      case EncryptionType.Rsa2048_OaepSha256_B64:
      case EncryptionType.Rsa2048_OaepSha1_B64:
      case EncryptionType.Rsa2048_OaepSha256_HmacSha256_B64: // HmacSha256 types are deprecated
      case EncryptionType.Rsa2048_OaepSha1_HmacSha256_B64:
        break;
      default:
        throw new Error("encType unavailable.");
    }

    if (encPieces == null || encPieces.length <= 0) {
      throw new Error("encPieces unavailable.");
    }

    const data = Utils.fromB64ToArray(encPieces[0]).buffer;
    const privateKey = privateKeyValue ?? (await this.getPrivateKey());
    if (privateKey == null) {
      throw new Error("No private key.");
    }

    let alg: "sha1" | "sha256" = "sha1";
    switch (encType) {
      case EncryptionType.Rsa2048_OaepSha256_B64:
      case EncryptionType.Rsa2048_OaepSha256_HmacSha256_B64:
        alg = "sha256";
        break;
      case EncryptionType.Rsa2048_OaepSha1_B64:
      case EncryptionType.Rsa2048_OaepSha1_HmacSha256_B64:
        break;
      default:
        throw new Error("encType unavailable.");
    }

    return this.cryptoFunctionService.rsaDecrypt(data, privateKey, alg);
  }

  // EFForg/OpenWireless
  // ref https://github.com/EFForg/OpenWireless/blob/master/app/js/diceware.js
  async randomNumber(min: number, max: number): Promise<number> {
    let rval = 0;
    const range = max - min + 1;
    const bitsNeeded = Math.ceil(Math.log2(range));
    if (bitsNeeded > 53) {
      throw new Error("We cannot generate numbers larger than 53 bits.");
    }

    const bytesNeeded = Math.ceil(bitsNeeded / 8);
    const mask = Math.pow(2, bitsNeeded) - 1;
    // 7776 -> (2^13 = 8192) -1 == 8191 or 0x00001111 11111111

    // Fill a byte array with N random numbers
    const byteArray = new Uint8Array(await this.cryptoFunctionService.randomBytes(bytesNeeded));

    let p = (bytesNeeded - 1) * 8;
    for (let i = 0; i < bytesNeeded; i++) {
      rval += byteArray[i] * Math.pow(2, p);
      p -= 8;
    }

    // Use & to apply the mask and reduce the number of recursive lookups
    rval = rval & mask;

    if (rval >= range) {
      // Integer out of acceptable range
      return this.randomNumber(min, max);
    }

    // Return an integer that falls within the range
    return min + rval;
  }

  // ---HELPERS---

  protected async validateUserKey(key?: UserSymKey): Promise<boolean> {
    key ||= await this.getUserKeyFromMemory();
    if (key == null) {
      return false;
    }

    try {
      const encPrivateKey = await this.stateService.getEncryptedPrivateKey();
      if (encPrivateKey == null) {
        return false;
      }

      const privateKey = await this.decryptToBytes(new EncString(encPrivateKey), key);
      await this.cryptoFunctionService.rsaExtractPublicKey(privateKey);
    } catch (e) {
      return false;
    }

    return true;
  }

  protected async storeAdditionalKeys(key: SymmetricCryptoKey, userId?: string) {
    const storeAuto = await this.shouldStoreKey(KeySuffixOptions.Auto, userId);

    if (storeAuto) {
      await this.stateService.setUserSymKeyAuto(key.keyB64, { userId: userId });
    } else {
      await this.stateService.setUserSymKeyAuto(null, { userId: userId });
    }
  }

  protected async shouldStoreKey(keySuffix: KeySuffixOptions, userId?: string) {
    let shouldStoreKey = false;
    if (keySuffix === KeySuffixOptions.Auto) {
      const vaultTimeout = await this.stateService.getVaultTimeout({ userId: userId });
      shouldStoreKey = vaultTimeout == null;
    } else if (keySuffix === KeySuffixOptions.Biometric) {
      const biometricUnlock = await this.stateService.getBiometricUnlock({ userId: userId });
      shouldStoreKey = biometricUnlock && this.platformUtilService.supportsSecureStorage();
    }
    return shouldStoreKey;
  }

  protected async retrieveUserKeyFromStorage(
    keySuffix: KeySuffixOptions,
    userId?: string
  ): Promise<UserSymKey> {
    let userKey: string;
    if (keySuffix === KeySuffixOptions.Auto) {
      userKey = await this.stateService.getUserSymKeyAuto({ userId: userId });
    } else if (keySuffix === KeySuffixOptions.Biometric) {
      userKey = await this.stateService.getUserSymKeyBiometric({ userId: userId });
    }
    return new SymmetricCryptoKey(Utils.fromB64ToArray(userKey).buffer) as UserSymKey;
  }

  private async stretchKey(key: SymmetricCryptoKey): Promise<SymmetricCryptoKey> {
    const newKey = new Uint8Array(64);
    const encKey = await this.cryptoFunctionService.hkdfExpand(key.key, "enc", 32, "sha256");
    const macKey = await this.cryptoFunctionService.hkdfExpand(key.key, "mac", 32, "sha256");
    newKey.set(new Uint8Array(encKey));
    newKey.set(new Uint8Array(macKey), 32);
    return new SymmetricCryptoKey(newKey.buffer);
  }

  private async hashPhrase(hash: ArrayBuffer, minimumEntropy = 64) {
    const entropyPerWord = Math.log(EFFLongWordList.length) / Math.log(2);
    let numWords = Math.ceil(minimumEntropy / entropyPerWord);

    const hashArr = Array.from(new Uint8Array(hash));
    const entropyAvailable = hashArr.length * 4;
    if (numWords * entropyPerWord > entropyAvailable) {
      throw new Error("Output entropy of hash function is too small");
    }

    const phrase: string[] = [];
    let hashNumber = bigInt.fromArray(hashArr, 256);
    while (numWords--) {
      const remainder = hashNumber.mod(EFFLongWordList.length);
      hashNumber = hashNumber.divide(EFFLongWordList.length);
      phrase.push(EFFLongWordList[remainder as any]);
    }
    return phrase;
  }

  private async buildProtectedUserSymKey(
    masterKey: MasterKey,
    newUserSymKey: ArrayBuffer
  ): Promise<[UserSymKey, EncString]> {
    let protectedUserSymKey: EncString = null;
    if (masterKey.key.byteLength === 32) {
      const stretchedMasterKey = await this.stretchKey(masterKey);
      protectedUserSymKey = await this.encrypt(newUserSymKey, stretchedMasterKey);
    } else if (masterKey.key.byteLength === 64) {
      protectedUserSymKey = await this.encrypt(newUserSymKey, masterKey);
    } else {
      throw new Error("Invalid key size.");
    }
    return [new SymmetricCryptoKey(newUserSymKey) as UserSymKey, protectedUserSymKey];
  }

  private async clearStoredUserKeys(userId?: string): Promise<void> {
    await this.stateService.setUserSymKeyAuto(null, { userId: userId });
    await this.stateService.setUserSymKeyBiometric(null, { userId: userId });
  }

  async makeKey(
    password: string,
    salt: string,
    kdf: KdfType,
    kdfConfig: KdfConfig
  ): Promise<SymmetricCryptoKey> {
    let key: ArrayBuffer = null;
    if (kdf == null || kdf === KdfType.PBKDF2_SHA256) {
      if (kdfConfig.iterations == null) {
        kdfConfig.iterations = 5000;
      } else if (kdfConfig.iterations < 5000) {
        throw new Error("PBKDF2 iteration minimum is 5000.");
      }
      key = await this.cryptoFunctionService.pbkdf2(password, salt, "sha256", kdfConfig.iterations);
    } else if (kdf == KdfType.Argon2id) {
      if (kdfConfig.iterations == null) {
        kdfConfig.iterations = DEFAULT_ARGON2_ITERATIONS;
      } else if (kdfConfig.iterations < 2) {
        throw new Error("Argon2 iteration minimum is 2.");
      }

      if (kdfConfig.memory == null) {
        kdfConfig.memory = DEFAULT_ARGON2_MEMORY;
      } else if (kdfConfig.memory < 16) {
        throw new Error("Argon2 memory minimum is 16 MB");
      } else if (kdfConfig.memory > 1024) {
        throw new Error("Argon2 memory maximum is 1024 MB");
      }

      if (kdfConfig.parallelism == null) {
        kdfConfig.parallelism = DEFAULT_ARGON2_PARALLELISM;
      } else if (kdfConfig.parallelism < 1) {
        throw new Error("Argon2 parallelism minimum is 1.");
      }

      const saltHash = await this.cryptoFunctionService.hash(salt, "sha256");
      key = await this.cryptoFunctionService.argon2(
        password,
        saltHash,
        kdfConfig.iterations,
        kdfConfig.memory * 1024, // convert to KiB from MiB
        kdfConfig.parallelism
      );
    } else {
      throw new Error("Unknown Kdf.");
    }
    return new SymmetricCryptoKey(key);
  }

  /**
   * @deprecated the UserSymKey is always stored decrypted
   */
  private async getEncKeyHelper(key: SymmetricCryptoKey = null): Promise<SymmetricCryptoKey> {
    const inMemoryKey = await this.stateService.getDecryptedCryptoSymmetricKey();
    if (inMemoryKey != null) {
      return inMemoryKey;
    }

    const encKey = await this.stateService.getEncryptedCryptoSymmetricKey();
    if (encKey == null) {
      return null;
    }

    if (key == null) {
      key = await this.getUserKey();
    }
    if (key == null) {
      return null;
    }

    let decEncKey: ArrayBuffer;
    const encKeyCipher = new EncString(encKey);
    if (encKeyCipher.encryptionType === EncryptionType.AesCbc256_B64) {
      decEncKey = await this.decryptToBytes(encKeyCipher, key);
    } else if (encKeyCipher.encryptionType === EncryptionType.AesCbc256_HmacSha256_B64) {
      const newKey = await this.stretchKey(key);
      decEncKey = await this.decryptToBytes(encKeyCipher, newKey);
    } else {
      throw new Error("Unsupported encKey type.");
    }
    if (decEncKey == null) {
      return null;
    }
    const symmetricCryptoKey = new SymmetricCryptoKey(decEncKey);
    await this.stateService.setDecryptedCryptoSymmetricKey(symmetricCryptoKey);
    return symmetricCryptoKey;
  }

  /**
   * @deprecated July 25 2022: Get the key you need from CryptoService (getKeyForUserEncryption or getOrgKey)
   * and then call encryptService.encrypt
   */
  async encrypt(plainValue: string | ArrayBuffer, key?: SymmetricCryptoKey): Promise<EncString> {
    key ||= await this.getKeyForUserEncryption();
    return await this.encryptService.encrypt(plainValue, key);
  }

  /**
   * @deprecated July 25 2022: Get the key you need from CryptoService (getKeyForUserEncryption or getOrgKey)
   * and then call encryptService.encryptToBytes
   */
  async encryptToBytes(plainValue: ArrayBuffer, key?: SymmetricCryptoKey): Promise<EncArrayBuffer> {
    key ||= await this.getKeyForUserEncryption();
    return this.encryptService.encryptToBytes(plainValue, key);
  }

  /**
   * @deprecated July 25 2022: Get the key you need from CryptoService (getKeyForUserEncryption or getOrgKey)
   * and then call encryptService.decryptToBytes
   */
  async decryptToBytes(encString: EncString, key?: SymmetricCryptoKey): Promise<ArrayBuffer> {
    key ||= await this.getKeyForUserEncryption();
    return this.encryptService.decryptToBytes(encString, key);
  }

  /**
   * @deprecated July 25 2022: Get the key you need from CryptoService (getKeyForUserEncryption or getOrgKey)
   * and then call encryptService.decryptToUtf8
   */
  async decryptToUtf8(encString: EncString, key?: SymmetricCryptoKey): Promise<string> {
    key ||= await this.getKeyForUserEncryption();
    return await this.encryptService.decryptToUtf8(encString, key);
  }

  /**
   * @deprecated July 25 2022: Get the key you need from CryptoService (getKeyForUserEncryption or getOrgKey)
   * and then call encryptService.decryptToBytes
   */
  async decryptFromBytes(encBuffer: EncArrayBuffer, key: SymmetricCryptoKey): Promise<ArrayBuffer> {
    if (encBuffer == null) {
      throw new Error("No buffer provided for decryption.");
    }

    key ||= await this.getKeyForUserEncryption();

    return this.encryptService.decryptToBytes(encBuffer, key);
  }

  /**
   * @deprecated use SetUserKey instead
   */
  async setEncKey(encKey: string): Promise<void> {
    if (encKey == null) {
      return;
    }

    await this.stateService.setDecryptedCryptoSymmetricKey(null);
    await this.stateService.setEncryptedCryptoSymmetricKey(encKey);
  }

  /**
   * @deprecated use getUserKey instead
   */
  @sequentialize(() => "getEncKey")
  getEncKey(key: SymmetricCryptoKey = null): Promise<SymmetricCryptoKey> {
    return this.getEncKeyHelper(key);
  }

  /**
   * @deprecated use hasUserKey instead
   */
  async hasEncKey(): Promise<boolean> {
    return (await this.stateService.getEncryptedCryptoSymmetricKey()) != null;
  }

  /**
   * @deprecated use clearKey instead
   */
  async clearEncKey(memoryOnly?: boolean, userId?: string): Promise<void> {
    await this.stateService.setDecryptedCryptoSymmetricKey(null, { userId: userId });
    if (!memoryOnly) {
      await this.stateService.setEncryptedCryptoSymmetricKey(null, { userId: userId });
    }
  }

  /**
   * @deprecated we wouldn't be saving encrypted/decrypted versions of the user symmetric key
   */
  async toggleKey(): Promise<any> {
    // const key = await this.getKey();
    // await this.setKey(key);
  }
}

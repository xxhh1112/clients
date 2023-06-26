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
  OrgKey,
  PinKey,
  SymmetricCryptoKey,
  UserKey,
} from "../models/domain/symmetric-crypto-key";

export class CryptoService implements CryptoServiceAbstraction {
  constructor(
    protected cryptoFunctionService: CryptoFunctionService,
    protected encryptService: EncryptService,
    protected platformUtilService: PlatformUtilsService,
    protected logService: LogService,
    protected stateService: StateService
  ) {}

  async getKeyForUserEncryption(): Promise<SymmetricCryptoKey> {
    const userKey = await this.getUserKeyFromMemory();
    if (userKey != null) {
      return userKey;
    }

    // Legacy support: encryption used to be done with the master key (derived from master password).
    // Users who have not migrated will have a null user key and must use the master key instead.
    return await this.getMasterKey();
  }

  async setUserKey(key: UserKey, userId?: string): Promise<void> {
    await this.stateService.setUserKey(key, { userId: userId });
    await this.storeAdditionalKeys(key, userId);
  }

  async toggleKey(): Promise<void> {
    const key = await this.getUserKeyFromMemory();
    await this.setUserKey(key);
  }

  async getUserKeyFromMemory(userId?: string): Promise<UserKey> {
    return await this.stateService.getUserKey({ userId: userId });
  }

  async getUserKeyFromStorage(
    keySuffix: KeySuffixOptions.Auto | KeySuffixOptions.Biometric,
    userId?: string
  ): Promise<UserKey> {
    const userKey = await this.retrieveUserKeyFromStorage(keySuffix, userId);
    if (userKey != null) {
      if (!(await this.validateUserKey(userKey))) {
        this.logService.warning("Wrong key, throwing away stored key");
        await this.clearAllStoredUserKeys(userId);
        return null;
      }

      return userKey;
    }
    return null;
  }

  async hasUserKey(): Promise<boolean> {
    return (
      (await this.hasUserKeyInMemory()) ||
      (await this.hasUserKeyStored(KeySuffixOptions.Auto)) ||
      (await this.hasUserKeyStored(KeySuffixOptions.Biometric))
    );
  }

  async hasUserKeyInMemory(userId?: string): Promise<boolean> {
    return (await this.stateService.getUserKey({ userId: userId })) != null;
  }

  async hasUserKeyStored(
    keySuffix: KeySuffixOptions.Auto | KeySuffixOptions.Biometric,
    userId?: string
  ): Promise<boolean> {
    if (keySuffix === KeySuffixOptions.Biometric) {
      const oldKey = await this.stateService.hasCryptoMasterKeyBiometric({ userId: userId });
      return oldKey || (await this.stateService.hasUserKeyBiometric({ userId: userId }));
    }
    return (await this.retrieveUserKeyFromStorage(keySuffix, userId)) != null;
  }

  async makeUserKey(masterKey: MasterKey): Promise<[UserKey, EncString]> {
    masterKey ||= await this.getMasterKey();
    if (masterKey == null) {
      throw new Error("No Master Key found.");
    }

    const newUserKey = await this.cryptoFunctionService.randomBytes(64);
    return this.buildProtectedSymmetricKey(masterKey, newUserKey);
  }

  async clearUserKey(clearStoredKeys = true, userId?: string): Promise<void> {
    await this.stateService.setUserKey(null, { userId: userId });
    if (clearStoredKeys) {
      await this.clearAllStoredUserKeys(userId);
    }
  }

  async clearStoredUserKey(keySuffix: KeySuffixOptions, userId?: string): Promise<void> {
    switch (keySuffix) {
      case KeySuffixOptions.Auto:
        this.stateService.setUserKeyAuto(null, { userId: userId });
        break;
      case KeySuffixOptions.Biometric:
        this.stateService.setUserKeyBiometric(null, { userId: userId });
        break;
      case KeySuffixOptions.Pin:
        this.stateService.setUserKeyPinEphemeral(null, { userId: userId });
        break;
    }
  }

  async setUserKeyMasterKey(userKeyMasterKey: string, userId?: string): Promise<void> {
    await this.stateService.setUserKeyMasterKey(userKeyMasterKey, { userId: userId });
  }

  async setMasterKey(key: MasterKey, userId?: string): Promise<void> {
    await this.stateService.setMasterKey(key, { userId: userId });
  }

  async getMasterKey(userId?: string): Promise<MasterKey> {
    let masterKey = await this.stateService.getMasterKey({ userId: userId });
    masterKey ||= (await this.stateService.getCryptoMasterKey({ userId: userId })) as MasterKey;
    return masterKey;
  }

  async makeMasterKey(
    password: string,
    email: string,
    kdf: KdfType,
    KdfConfig: KdfConfig
  ): Promise<MasterKey> {
    return (await this.makeKey(password, email, kdf, KdfConfig)) as MasterKey;
  }

  async clearMasterKey(userId?: string): Promise<void> {
    await this.stateService.setMasterKey(null, { userId: userId });
  }

  async encryptUserKeyWithMasterKey(
    masterKey: MasterKey,
    userKey?: UserKey
  ): Promise<[UserKey, EncString]> {
    userKey ||= await this.getUserKeyFromMemory();
    return this.buildProtectedSymmetricKey(masterKey, userKey.key);
  }

  async decryptUserKeyWithMasterKey(
    masterKey: MasterKey,
    userKey?: EncString,
    userId?: string
  ): Promise<UserKey> {
    masterKey ||= await this.getMasterKey();
    if (masterKey == null) {
      throw new Error("No master key found.");
    }

    if (!userKey) {
      const userKeyMasterKey = await this.stateService.getUserKeyMasterKey({
        userId: userId,
      });
      if (userKeyMasterKey == null) {
        throw new Error("No encrypted user key found.");
      }
      userKey = new EncString(userKeyMasterKey);
    }

    let decUserKey: ArrayBuffer;
    if (userKey.encryptionType === EncryptionType.AesCbc256_B64) {
      decUserKey = await this.encryptService.decryptToBytes(userKey, masterKey);
    } else if (userKey.encryptionType === EncryptionType.AesCbc256_HmacSha256_B64) {
      const newKey = await this.stretchKey(masterKey);
      decUserKey = await this.encryptService.decryptToBytes(userKey, newKey);
    } else {
      throw new Error("Unsupported encryption type.");
    }
    if (decUserKey == null) {
      return null;
    }

    return new SymmetricCryptoKey(decUserKey) as UserKey;
  }

  async hashPassword(password: string, key: MasterKey, hashPurpose?: HashPurpose): Promise<string> {
    key ||= await this.getMasterKey();

    if (password == null || key == null) {
      throw new Error("Invalid parameters.");
    }

    const iterations = hashPurpose === HashPurpose.LocalAuthorization ? 2 : 1;
    const hash = await this.cryptoFunctionService.pbkdf2(key.key, password, "sha256", iterations);
    return Utils.fromBufferToB64(hash);
  }

  async setKeyHash(keyHash: string): Promise<void> {
    await this.stateService.setKeyHash(keyHash);
  }

  async getKeyHash(): Promise<string> {
    return await this.stateService.getKeyHash();
  }

  async clearKeyHash(userId?: string): Promise<void> {
    return await this.stateService.setKeyHash(null, { userId: userId });
  }

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

  async getOrgKey(orgId: string): Promise<OrgKey> {
    if (orgId == null) {
      return null;
    }

    const orgKeys = await this.getOrgKeys();
    if (orgKeys == null || !orgKeys.has(orgId)) {
      return null;
    }

    return orgKeys.get(orgId);
  }

  @sequentialize(() => "getOrgKeys")
  async getOrgKeys(): Promise<Map<string, OrgKey>> {
    const result: Map<string, OrgKey> = new Map<string, OrgKey>();
    const decryptedOrganizationKeys = await this.stateService.getDecryptedOrganizationKeys();
    if (decryptedOrganizationKeys != null && decryptedOrganizationKeys.size > 0) {
      return decryptedOrganizationKeys as Map<string, OrgKey>;
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
      const decOrgKey = (await encOrgKey.decrypt(this)) as OrgKey;
      result.set(orgId, decOrgKey);

      setKey = true;
    }

    if (setKey) {
      await this.stateService.setDecryptedOrganizationKeys(result);
    }

    return result;
  }

  async makeOrgDataEncKey(orgKey: OrgKey): Promise<[SymmetricCryptoKey, EncString]> {
    if (orgKey == null) {
      throw new Error("No Org Key provided");
    }

    const newSymKey = await this.cryptoFunctionService.randomBytes(64);
    return this.buildProtectedSymmetricKey(orgKey, newSymKey);
  }

  async clearOrgKeys(memoryOnly?: boolean, userId?: string): Promise<void> {
    await this.stateService.setDecryptedOrganizationKeys(null, { userId: userId });
    if (!memoryOnly) {
      await this.stateService.setEncryptedOrganizationKeys(null, { userId: userId });
    }
  }

  async setProviderKeys(providers: ProfileProviderResponse[]): Promise<void> {
    const providerKeys: any = {};
    providers.forEach((provider) => {
      providerKeys[provider.id] = provider.key;
    });

    await this.stateService.setDecryptedProviderKeys(null);
    return await this.stateService.setEncryptedProviderKeys(providerKeys);
  }

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

  async clearProviderKeys(memoryOnly?: boolean, userId?: string): Promise<void> {
    await this.stateService.setDecryptedProviderKeys(null, { userId: userId });
    if (!memoryOnly) {
      await this.stateService.setEncryptedProviderKeys(null, { userId: userId });
    }
  }

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

  async makeShareKey(): Promise<[EncString, SymmetricCryptoKey]> {
    const shareKey = await this.cryptoFunctionService.randomBytes(64);
    const publicKey = await this.getPublicKey();
    const encShareKey = await this.rsaEncrypt(shareKey, publicKey);
    return [encShareKey, new SymmetricCryptoKey(shareKey)];
  }

  async setPrivateKey(encPrivateKey: string): Promise<void> {
    if (encPrivateKey == null) {
      return;
    }

    await this.stateService.setDecryptedPrivateKey(null);
    await this.stateService.setEncryptedPrivateKey(encPrivateKey);
  }

  async getPrivateKey(): Promise<ArrayBuffer> {
    const decryptedPrivateKey = await this.stateService.getDecryptedPrivateKey();
    if (decryptedPrivateKey != null) {
      return decryptedPrivateKey;
    }

    const encPrivateKey = await this.stateService.getEncryptedPrivateKey();
    if (encPrivateKey == null) {
      return null;
    }

    const privateKey = await this.encryptService.decryptToBytes(new EncString(encPrivateKey), null);
    await this.stateService.setDecryptedPrivateKey(privateKey);
    return privateKey;
  }

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

  async makeKeyPair(key?: SymmetricCryptoKey): Promise<[string, EncString]> {
    key ||= await this.getUserKeyFromMemory();

    const keyPair = await this.cryptoFunctionService.rsaGenerateKeyPair(2048);
    const publicB64 = Utils.fromBufferToB64(keyPair[0]);
    const privateEnc = await this.encryptService.encrypt(keyPair[1], key);
    return [publicB64, privateEnc];
  }

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

  async makePinKey(pin: string, salt: string, kdf: KdfType, kdfConfig: KdfConfig): Promise<PinKey> {
    const pinKey = await this.makeKey(pin, salt, kdf, kdfConfig);
    return (await this.stretchKey(pinKey)) as PinKey;
  }

  async clearPinProtectedKey(userId?: string): Promise<void> {
    await this.stateService.setUserKeyPin(null, { userId: userId });
    await this.clearOldPinKeys(userId);
  }

  async clearOldPinKeys(userId?: string): Promise<void> {
    await this.stateService.setEncryptedPinProtected(null, { userId: userId });
    await this.stateService.setDecryptedPinProtected(null, { userId: userId });
  }

  async decryptUserKeyWithPin(
    pin: string,
    salt: string,
    kdf: KdfType,
    kdfConfig: KdfConfig,
    pinProtectedUserKey?: EncString
  ): Promise<UserKey> {
    pinProtectedUserKey ||= await this.stateService.getUserKeyPin();
    if (!pinProtectedUserKey) {
      throw new Error("No PIN protected key found.");
    }
    const pinKey = await this.makePinKey(pin, salt, kdf, kdfConfig);
    const userKey = await this.encryptService.decryptToBytes(pinProtectedUserKey, pinKey);
    return new SymmetricCryptoKey(userKey) as UserKey;
  }

  async decryptMasterKeyWithPin(
    pin: string,
    salt: string,
    kdf: KdfType,
    kdfConfig: KdfConfig,
    pinProtectedMasterKey?: EncString
  ): Promise<MasterKey> {
    if (!pinProtectedMasterKey) {
      const pinProtectedMasterKeyString = await this.stateService.getEncryptedPinProtected();
      if (pinProtectedMasterKeyString == null) {
        throw new Error("No PIN protected key found.");
      }
      pinProtectedMasterKey = new EncString(pinProtectedMasterKeyString);
    }
    const pinKey = await this.makePinKey(pin, salt, kdf, kdfConfig);
    const masterKey = await this.encryptService.decryptToBytes(pinProtectedMasterKey, pinKey);
    return new SymmetricCryptoKey(masterKey) as MasterKey;
  }

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

  async clearKeys(userId?: string): Promise<any> {
    await this.clearUserKey(true, userId);
    await this.clearKeyHash(userId);
    await this.clearOrgKeys(false, userId);
    await this.clearProviderKeys(false, userId);
    await this.clearKeyPair(false, userId);
    await this.clearPinProtectedKey(userId);
  }

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

  protected async validateUserKey(key: UserKey): Promise<boolean> {
    if (!key) {
      return false;
    }

    try {
      const encPrivateKey = await this.stateService.getEncryptedPrivateKey();
      if (encPrivateKey == null) {
        return false;
      }

      const privateKey = await this.encryptService.decryptToBytes(
        new EncString(encPrivateKey),
        key
      );
      await this.cryptoFunctionService.rsaExtractPublicKey(privateKey);
    } catch (e) {
      return false;
    }

    return true;
  }

  /**
   * Regenerates any additional keys if needed. Useful to make sure
   * other keys stay in sync when the user key has been rotated.
   * @param key The user key
   * @param userId The desired user
   */
  protected async storeAdditionalKeys(key: UserKey, userId?: string) {
    const storeAuto = await this.shouldStoreKey(KeySuffixOptions.Auto, userId);
    if (storeAuto) {
      await this.stateService.setUserKeyAuto(key.keyB64, { userId: userId });
    } else {
      await this.stateService.setUserKeyAuto(null, { userId: userId });
    }

    const storePin = await this.shouldStoreKey(KeySuffixOptions.Pin, userId);
    if (storePin) {
      await this.storePinKey(key);
    } else {
      await this.stateService.setUserKeyPin(null, { userId: userId });
    }
  }

  protected async storePinKey(key: UserKey) {
    const email = await this.stateService.getEmail();
    const kdf = await this.stateService.getKdfType();
    const kdfConfig = await this.stateService.getKdfConfig();
    const pin = await this.encryptService.decryptToUtf8(
      new EncString(await this.stateService.getProtectedPin()),
      key
    );
    const pinKey = await this.makePinKey(pin, email, kdf, kdfConfig);
    await this.stateService.setUserKeyPin(await this.encryptService.encrypt(key.key, pinKey));
  }

  protected async shouldStoreKey(keySuffix: KeySuffixOptions, userId?: string) {
    let shouldStoreKey = false;
    switch (keySuffix) {
      case KeySuffixOptions.Auto: {
        const vaultTimeout = await this.stateService.getVaultTimeout({ userId: userId });
        shouldStoreKey = vaultTimeout == null;
        break;
      }
      case KeySuffixOptions.Pin: {
        const protectedPin = await this.stateService.getProtectedPin({ userId: userId });
        // This could cause a possible timing issue. Need to make sure the ephemeral key is set before
        // we set our user key
        const userKeyPinEphemeral = await this.stateService.getUserKeyPinEphemeral({
          userId: userId,
        });
        shouldStoreKey = !!protectedPin && !userKeyPinEphemeral;
        break;
      }
    }
    return shouldStoreKey;
  }

  protected async retrieveUserKeyFromStorage(
    keySuffix: KeySuffixOptions,
    userId?: string
  ): Promise<UserKey> {
    if (keySuffix === KeySuffixOptions.Auto) {
      await this.migrateAutoKeyIfNeeded(userId);
      const userKey = await this.stateService.getUserKeyAuto({ userId: userId });
      if (userKey) {
        return new SymmetricCryptoKey(Utils.fromB64ToArray(userKey).buffer) as UserKey;
      }
    }
    return null;
  }

  private async migrateAutoKeyIfNeeded(userId?: string) {
    const oldAutoKey = await this.stateService.getCryptoMasterKeyAuto({ userId: userId });
    if (oldAutoKey) {
      // decrypt
      const masterKey = new SymmetricCryptoKey(
        Utils.fromB64ToArray(oldAutoKey).buffer
      ) as MasterKey;
      const userKey = await this.decryptUserKeyWithMasterKey(
        masterKey,
        new EncString(await this.stateService.getEncryptedCryptoSymmetricKey())
      );
      // migrate
      await this.stateService.setUserKeyAuto(userKey.keyB64, { userId: userId });
      await this.stateService.setCryptoMasterKeyAuto(null, { userId: userId });
    }
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

  private async buildProtectedSymmetricKey<T extends SymmetricCryptoKey>(
    encryptionKey: SymmetricCryptoKey,
    newSymKey: ArrayBuffer
  ): Promise<[T, EncString]> {
    let protectedSymKey: EncString = null;
    if (encryptionKey.key.byteLength === 32) {
      const stretchedEncryptionKey = await this.stretchKey(encryptionKey);
      protectedSymKey = await this.encryptService.encrypt(newSymKey, stretchedEncryptionKey);
    } else if (encryptionKey.key.byteLength === 64) {
      protectedSymKey = await this.encryptService.encrypt(newSymKey, encryptionKey);
    } else {
      throw new Error("Invalid key size.");
    }
    return [new SymmetricCryptoKey(newSymKey) as T, protectedSymKey];
  }

  private async clearAllStoredUserKeys(userId?: string): Promise<void> {
    await this.stateService.setUserKeyAuto(null, { userId: userId });
    await this.stateService.setUserKeyBiometric(null, { userId: userId });
    await this.stateService.setUserKeyPinEphemeral(null, { userId: userId });
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
}

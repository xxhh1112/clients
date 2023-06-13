import { KeySuffixOptions } from "@bitwarden/common/enums";
import { CryptoFunctionService } from "@bitwarden/common/platform/abstractions/crypto-function.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { EncString } from "@bitwarden/common/platform/models/domain/enc-string";
import {
  MasterKey,
  SymmetricCryptoKey,
  UserSymKey,
} from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import { CryptoService } from "@bitwarden/common/platform/services/crypto.service";
import { CsprngString } from "@bitwarden/common/types/csprng";

import { ElectronStateService } from "./electron-state.service.abstraction";

export class ElectronCryptoService extends CryptoService {
  constructor(
    cryptoFunctionService: CryptoFunctionService,
    encryptService: EncryptService,
    platformUtilsService: PlatformUtilsService,
    logService: LogService,
    protected override stateService: ElectronStateService
  ) {
    super(cryptoFunctionService, encryptService, platformUtilsService, logService, stateService);
  }

  protected override async storeAdditionalKeys(key: UserSymKey, userId?: string) {
    await super.storeAdditionalKeys(key, userId);

    const storeBiometricKey = await this.shouldStoreKey(KeySuffixOptions.Biometric, userId);

    if (storeBiometricKey) {
      await this.storeBiometricKey(key, userId);
    } else {
      await this.stateService.setUserSymKeyBiometric(null, { userId: userId });
    }
  }

  protected override async retrieveUserKeyFromStorage(
    keySuffix: KeySuffixOptions,
    userId?: string
  ): Promise<UserSymKey> {
    if (keySuffix === KeySuffixOptions.Biometric) {
      await this.migrateBiometricKeyIfNeeded(userId);
      const userKey = await this.stateService.getUserSymKeyBiometric({ userId: userId });
      return new SymmetricCryptoKey(Utils.fromB64ToArray(userKey).buffer) as UserSymKey;
    }
    return await super.retrieveUserKeyFromStorage(keySuffix, userId);
  }

  protected async storeBiometricKey(key: UserSymKey, userId?: string): Promise<void> {
    let clientEncKeyHalf: CsprngString = null;
    if (await this.stateService.getBiometricRequirePasswordOnStart({ userId })) {
      clientEncKeyHalf = await this.getBiometricEncryptionClientKeyHalf(userId);
    }
    await this.stateService.setUserSymKeyBiometric(
      { key: key.keyB64, clientEncKeyHalf },
      { userId: userId }
    );
  }

  private async getBiometricEncryptionClientKeyHalf(userId?: string): Promise<CsprngString | null> {
    try {
      let biometricKey = await this.stateService
        .getBiometricEncryptionClientKeyHalf({ userId })
        .then((result) => result?.decrypt(null /* user encrypted */))
        .then((result) => result as CsprngString);
      const userKey = await this.getKeyForUserEncryption();
      if (biometricKey == null && userKey != null) {
        const keyBytes = await this.cryptoFunctionService.randomBytes(32);
        biometricKey = Utils.fromBufferToUtf8(keyBytes) as CsprngString;
        const encKey = await this.encryptService.encrypt(biometricKey, userKey);
        await this.stateService.setBiometricEncryptionClientKeyHalf(encKey);
      }

      return biometricKey;
    } catch {
      return null;
    }
  }

  private async migrateBiometricKeyIfNeeded(userId?: string) {
    if (await this.stateService.hasCryptoMasterKeyBiometric({ userId })) {
      const oldBiometricKey = await this.stateService.getCryptoMasterKeyBiometric({ userId });
      // decrypt
      const masterKey = new SymmetricCryptoKey(Utils.fromB64ToArray(oldBiometricKey)) as MasterKey;
      let encUserKey = await this.stateService.getEncryptedCryptoSymmetricKey();
      encUserKey = encUserKey ?? (await this.stateService.getUserSymKeyMasterKey());
      if (!encUserKey) {
        throw new Error("No user key found during biometric migration");
      }
      const userSymKey = await this.decryptUserSymKeyWithMasterKey(
        masterKey,
        new EncString(encUserKey)
      );
      // migrate
      await this.storeBiometricKey(userSymKey, userId);
      await this.stateService.setCryptoMasterKeyBiometric(null, { userId });
    }
  }
}

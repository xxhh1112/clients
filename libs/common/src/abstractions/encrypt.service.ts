import { IEncrypted } from "../interfaces/IEncrypted";
import { Decryptable } from "../interfaces/decryptable.interface";
import { InitializerMetadata } from "../interfaces/initializer-metadata.interface";
import { EncArrayBuffer } from "../models/domain/enc-array-buffer";
import { EncString } from "../models/domain/enc-string";
import { SymmetricCryptoKey } from "../models/domain/symmetric-crypto-key";

export abstract class EncryptService {
  abstract encrypt(plainValue: string | ArrayBuffer, key: SymmetricCryptoKey): Promise<EncString>;
  abstract encryptToBytes: (
    plainValue: ArrayBuffer,
    key?: SymmetricCryptoKey
  ) => Promise<EncArrayBuffer>;
  abstract decryptToUtf8: (encString: EncString, key: SymmetricCryptoKey) => Promise<string>;
  abstract decryptToBytes: (encThing: IEncrypted, key: SymmetricCryptoKey) => Promise<ArrayBuffer>;
  abstract resolveLegacyKey: (key: SymmetricCryptoKey, encThing: IEncrypted) => SymmetricCryptoKey;

  /**
   * Decrypt multiple items at once using the given key. This should be used for all bulk decryption operations because
   * it may be more performant.
   * @returns An array of the decrypted items, or `null` if decryption was aborted
   */
  abstract decryptItems: <T extends InitializerMetadata>(
    items: Decryptable<T>[],
    key: SymmetricCryptoKey
  ) => Promise<T[]>;
}

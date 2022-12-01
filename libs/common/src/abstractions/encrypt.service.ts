import { IEncrypted } from "../interfaces/IEncrypted";
import {
  Decryptable,
  DecryptableDomain,
  Encryptable,
  EncryptableDomain,
} from "../interfaces/crypto.interface";
import { OldDecryptable } from "../interfaces/decryptable.interface";
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
  abstract decryptItems: <T extends InitializerMetadata>(
    items: OldDecryptable<T>[],
    key: SymmetricCryptoKey
  ) => Promise<T[]>;

  abstract encryptView: <V extends Encryptable<EncryptableDomain<V>>>(
    view: V,
    key: SymmetricCryptoKey
  ) => Promise<EncryptableDomain<V>>;
  abstract decryptDomain: <V, D extends DecryptableDomain>(
    view: Decryptable<V, D>,
    domain: D,
    key: SymmetricCryptoKey
  ) => Promise<V>;
}

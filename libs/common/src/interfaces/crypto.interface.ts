import { EncryptService } from "../abstractions/encrypt.service";
import { SymmetricCryptoKey } from "../models/domain/symmetric-crypto-key";

export function nullableFactory<T extends new (...args: any[]) => any>(
  c: T,
  ...args: ConstructorParameters<T>
): InstanceType<T> | undefined {
  if (args[0] == null) {
    return null;
  }

  return new c(...args);
}

/**
 * Domain model that can be decrypted using views.
 */
export interface DecryptableDomain {
  /**
   * Unique GUID for the key used to encrypt the data
   */
  keyIdentifier(): string | null;
}

/**
 * View model that encrypts to Domain.
 */
export interface Encryptable<TDomain> {
  /**
   * Converts the View to a Domain model by encrypting data.
   *
   * @param encryptService EncryptService
   * @param key Key used to encrypt the data
   */
  encrypt(encryptService: EncryptService, key: SymmetricCryptoKey): Promise<TDomain>;

  /**
   * Unique GUID for the key used to encrypt the data
   */
  keyIdentifier(): string | null;
}

/**
 * Helper type for defining the static decrypt operation on view models.
 */
export type Decryptable<TView, TDomain extends DecryptableDomain> = {
  decrypt(encryptService: EncryptService, key: SymmetricCryptoKey, model: TDomain): Promise<TView>;
  fromJSON(obj: any): TView;
};

/**
 * Helper type for resolving which domain model the view encrypts to.
 */
export type EncryptableDomain<TView> = TView extends Encryptable<infer TDomain> ? TDomain : never;

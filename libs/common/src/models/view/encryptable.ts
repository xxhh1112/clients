import { CryptoService } from "../../abstractions/crypto.service";
import { SymmetricCryptoKey } from "../domain/symmetric-crypto-key";

export function nullableFactory<T extends new (...args: any) => any>(
  c: T,
  ...args: ConstructorParameters<T>
): InstanceType<T> | undefined {
  if (args[0] == null) {
    return undefined;
  }

  return new c(...(args as any[]));
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
export interface Encryptable<Domain> {
  /**
   * Converts the View to a Domain model by encrypting data.
   *
   * @param cryptoService CryptoService
   * @param key Key used to encrypt the data
   */
  encrypt(cryptoService: CryptoService, key: SymmetricCryptoKey): Promise<Domain>;

  /**
   * Unique GUID for the key used to encrypt the data
   */
  keyIdentifier(): string | null;
}

/**
 * Helper type for defining the static decrypt operation on view models.
 */
export type Decryptable<View, Domain extends DecryptableDomain> = {
  decrypt(cryptoService: CryptoService, key: SymmetricCryptoKey, model: Domain): View;
};

/**
 * Helper type for resolving which domain model the view encrypts to.
 */
export type EncryptableDomain<View> = View extends Encryptable<infer Domain> ? Domain : never;

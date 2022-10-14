import { CryptoService } from "../../abstractions/crypto.service";
import { SymmetricCryptoKey } from "../domain/symmetricCryptoKey";

export type Decryptable<View, Domain> = {
  decrypt(cryptoService: CryptoService, key: SymmetricCryptoKey, model: Domain): View;
};

export interface Encryptable<Domain> {
  encrypt(cryptoService: CryptoService, key: SymmetricCryptoKey): Promise<Domain>;
}

export type EncryptableDomain<View> = View extends Encryptable<infer Domain> ? Domain : never;

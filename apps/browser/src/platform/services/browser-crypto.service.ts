import { KeySuffixOptions } from "@bitwarden/common/enums";
import { CryptoService } from "@bitwarden/common/platform/services/crypto.service";

export class BrowserCryptoService extends CryptoService {
  protected async retrieveKeyFromStorage(keySuffix: KeySuffixOptions) {
    if (keySuffix === KeySuffixOptions.Biometric) {
      await this.platformUtilService.authenticateBiometric();
      return (await this.getUserKeyFromMemory())?.keyB64;
    }

    return await super.retrieveUserKeyFromStorage(keySuffix);
  }
}

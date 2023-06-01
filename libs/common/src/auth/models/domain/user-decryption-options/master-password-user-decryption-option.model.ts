import { UserDecryptionOptionBase } from "./user-decryption-options-base.model";

export class MasterPasswordUserDecryptionOption extends UserDecryptionOptionBase {
  constructor(enabled: boolean) {
    super(enabled);
  }
}

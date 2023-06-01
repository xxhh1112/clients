import { UserDecryptionOptionResponse } from "./user-decryption-option.response";

export class MasterPasswordDecryptionOptionResponse extends UserDecryptionOptionResponse {
  constructor(response: any) {
    super(response);
  }
}

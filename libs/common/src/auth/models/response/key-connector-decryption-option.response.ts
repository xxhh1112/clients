import { UserDecryptionOptionResponse } from "./user-decryption-option.response";

export class KeyConnectorDecryptionOptionResponse extends UserDecryptionOptionResponse {
  keyConnectorUrl: string;

  constructor(response: any) {
    super(response);
    this.keyConnectorUrl = this.getResponseProperty("KeyConnectorUrl");
  }
}

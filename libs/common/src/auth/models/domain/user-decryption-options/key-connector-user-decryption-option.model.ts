import { Jsonify } from "type-fest";

import { UserDecryptionOptionBase } from "./user-decryption-options-base.model";

export class KeyConnectorUserDecryptionOption extends UserDecryptionOptionBase {
  keyConnectorUrl: string;
  constructor(data: Jsonify<KeyConnectorUserDecryptionOption>) {
    super(data.enabled);
    this.keyConnectorUrl = data.keyConnectorUrl;
  }
}

import { Jsonify } from "type-fest";

import { UserDecryptionOptionBase } from "./user-decryption-options-base.model";

export class TrustedDeviceUserDecryptionOption extends UserDecryptionOptionBase {
  hasAdminApproval: boolean;
  constructor(data: Jsonify<TrustedDeviceUserDecryptionOption>) {
    super(data.enabled);
    this.hasAdminApproval = data.hasAdminApproval;
  }
}

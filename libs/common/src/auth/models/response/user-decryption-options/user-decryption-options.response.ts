import { BaseResponse } from "../../../../models/response/base.response";

import { KeyConnectorUserDecryptionOptionResponse } from "./key-connector-user-decryption-option.response";
import { TrustedDeviceUserDecryptionOptionResponse } from "./trusted-device-user-decryption-option.response";

export class UserDecryptionOptionsResponse extends BaseResponse {
  hasMasterPassword: boolean;
  trustedDeviceOption?: TrustedDeviceUserDecryptionOptionResponse;
  keyConnectorOption?: KeyConnectorUserDecryptionOptionResponse;

  constructor(response: any) {
    super(response);

    this.hasMasterPassword = this.getResponseProperty("HasMasterPassword");

    if (response.TrustedDeviceOption) {
      this.trustedDeviceOption = new TrustedDeviceUserDecryptionOptionResponse(
        this.getResponseProperty("TrustedDeviceOption")
      );
    }
    if (response.KeyConnectorOption) {
      this.keyConnectorOption = new KeyConnectorUserDecryptionOptionResponse(
        this.getResponseProperty("KeyConnectorOption")
      );
    }
  }
}

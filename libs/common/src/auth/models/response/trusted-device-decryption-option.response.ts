import { UserDecryptionOptionResponse } from "./user-decryption-option.response";

export class TrustedDeviceDecryptionOptionResponse extends UserDecryptionOptionResponse {
  hasAdminApproval: boolean;

  constructor(response: any) {
    super(response);
    this.hasAdminApproval = this.getResponseProperty("HasAdminApproval");
  }
}

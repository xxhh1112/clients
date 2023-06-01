import { KdfType } from "../../../enums";
import { BaseResponse } from "../../../models/response/base.response";
import { UserDecryptionOption } from "../../enums/user-decryption-option.enum";
import { UserDecryptionOptionResponseType } from "../../types/user-decryption-option-response";

import { KeyConnectorDecryptionOptionResponse } from "./key-connector-decryption-option.response";
import { MasterPasswordDecryptionOptionResponse } from "./master-password-decryption-option.response";
import { MasterPasswordPolicyResponse } from "./master-password-policy.response";
import { TrustedDeviceDecryptionOptionResponse } from "./trusted-device-decryption-option.response";
import { UserDecryptionOptionResponse } from "./user-decryption-option.response";

export class IdentityTokenResponse extends BaseResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  tokenType: string;

  resetMasterPassword: boolean;
  privateKey: string;
  key: string;
  twoFactorToken: string;
  kdf: KdfType;
  kdfIterations: number;
  kdfMemory?: number;
  kdfParallelism?: number;
  forcePasswordReset: boolean;
  masterPasswordPolicy: MasterPasswordPolicyResponse;
  apiUseKeyConnector: boolean;
  keyConnectorUrl: string;

  userDecryptionOptions: Array<UserDecryptionOptionResponseType>;

  constructor(response: any) {
    super(response);
    this.accessToken = response.access_token;
    this.expiresIn = response.expires_in;
    this.refreshToken = response.refresh_token;
    this.tokenType = response.token_type;

    this.resetMasterPassword = this.getResponseProperty("ResetMasterPassword");
    this.privateKey = this.getResponseProperty("PrivateKey");
    this.key = this.getResponseProperty("Key");
    this.twoFactorToken = this.getResponseProperty("TwoFactorToken");
    this.kdf = this.getResponseProperty("Kdf");
    this.kdfIterations = this.getResponseProperty("KdfIterations");
    this.kdfMemory = this.getResponseProperty("KdfMemory");
    this.kdfParallelism = this.getResponseProperty("KdfParallelism");
    this.forcePasswordReset = this.getResponseProperty("ForcePasswordReset");
    this.apiUseKeyConnector = this.getResponseProperty("ApiUseKeyConnector");
    this.keyConnectorUrl = this.getResponseProperty("KeyConnectorUrl");
    this.masterPasswordPolicy = new MasterPasswordPolicyResponse(
      this.getResponseProperty("MasterPasswordPolicy")
    );

    const serverUserDecryptionOptions = this.getResponseProperty("UserDecryptionOptions");

    if (serverUserDecryptionOptions) {
      this.userDecryptionOptions = serverUserDecryptionOptions.map(
        (serverUserDecryptionOption: any) => {
          const response = new UserDecryptionOptionResponse(serverUserDecryptionOption);

          switch (response.object) {
            case UserDecryptionOption.MASTER_PASSWORD: {
              return new MasterPasswordDecryptionOptionResponse(serverUserDecryptionOption);
            }
            case UserDecryptionOption.TRUSTED_DEVICE: {
              return new TrustedDeviceDecryptionOptionResponse(serverUserDecryptionOption);
            }
            case UserDecryptionOption.KEY_CONNECTOR: {
              return new KeyConnectorDecryptionOptionResponse(serverUserDecryptionOption);
            }
          }
        }
      );
    }
  }
}

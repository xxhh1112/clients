import { KeyConnectorDecryptionOptionResponse } from "../models/response/key-connector-decryption-option.response";
import { MasterPasswordDecryptionOptionResponse } from "../models/response/master-password-decryption-option.response";
import { TrustedDeviceDecryptionOptionResponse } from "../models/response/trusted-device-decryption-option.response";

export type UserDecryptionOptionResponseType =
  | MasterPasswordDecryptionOptionResponse
  | TrustedDeviceDecryptionOptionResponse
  | KeyConnectorDecryptionOptionResponse;

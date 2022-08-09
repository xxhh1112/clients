import { AuthenticationRequestType } from "@bitwarden/common/enums/authenticationRequestType";

export class PasswordlessAuthRequest {
  email: string;
  requestDeviceIdentifier: string;
  publicKey: string;
  type: AuthenticationRequestType;
  accessCode: string;
}

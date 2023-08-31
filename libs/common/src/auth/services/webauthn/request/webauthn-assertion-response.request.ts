import { AuthenticatorAssertionResponseRequest } from "./authenticator-assertion-response.request";

export class WebauthnAssertionResponseRequest {
  deviceResponse: AuthenticatorAssertionResponseRequest;
  token: string;

  constructor(token: string, deviceResponse: AuthenticatorAssertionResponseRequest) {
    this.deviceResponse = deviceResponse;
    this.token = token;
  }
}

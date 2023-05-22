import { DeviceRequest } from "./device.request";
import { TokenTwoFactorRequest } from "./token-two-factor.request";
import { TokenRequest } from "./token.request";

export class ExtensionTokenRequest extends TokenRequest {
  constructor(
    public token: string,
    protected twoFactor: TokenTwoFactorRequest,
    device?: DeviceRequest
  ) {
    super(twoFactor, device);
  }

  toIdentityToken(clientId: string) {
    const obj = super.toIdentityToken(clientId);

    obj.grant_type = "extension";
    obj.token = this.token;

    return obj;
  }
}

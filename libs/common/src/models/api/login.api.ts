import { Fido2KeyApi } from "../../vault/api/fido2-key.api";
import { BaseResponse } from "../response/base.response";

import { LoginUriApi } from "./login-uri.api";

export class LoginApi extends BaseResponse {
  uris: LoginUriApi[];
  username: string;
  password: string;
  passwordRevisionDate: string;
  totp: string;
  autofillOnPageLoad: boolean;
  fido2Key?: Fido2KeyApi;

  constructor(data: any = null) {
    super(data);
    if (data == null) {
      return;
    }
    this.username = this.getResponseProperty("Username");
    this.password = this.getResponseProperty("Password");
    this.passwordRevisionDate = this.getResponseProperty("PasswordRevisionDate");
    this.totp = this.getResponseProperty("Totp");
    this.autofillOnPageLoad = this.getResponseProperty("AutofillOnPageLoad");

    const uris = this.getResponseProperty("Uris");
    if (uris != null) {
      this.uris = uris.map((u: any) => new LoginUriApi(u));
    }

    const fido2Key = this.getResponseProperty("Fido2Key");
    if (fido2Key != null) {
      this.fido2Key = new Fido2KeyApi(fido2Key);
    }
  }
}

import { LoginApi } from "../../../models/api/login.api";

import { Fido2KeyData } from "./fido2-key.data";
import { LoginUriData } from "./login-uri.data";

export class LoginData {
  uris: LoginUriData[];
  username: string;
  password: string;
  passwordRevisionDate: string;
  totp: string;
  autofillOnPageLoad: boolean;
  fido2Keys?: Fido2KeyData[];

  constructor(data?: LoginApi) {
    if (data == null) {
      return;
    }

    this.username = data.username;
    this.password = data.password;
    this.passwordRevisionDate = data.passwordRevisionDate;
    this.totp = data.totp;
    this.autofillOnPageLoad = data.autofillOnPageLoad;

    if (data.uris) {
      this.uris = data.uris.map((u) => new LoginUriData(u));
    }

    if (data.fido2Keys) {
      this.fido2Keys = data.fido2Keys?.map((key) => new Fido2KeyData(key));
    }
  }
}

import { Jsonify } from "type-fest";

import { nullableFactory } from "../../interfaces/crypto.interface";
import { LoginData } from "../data/login.data";

import { EncString } from "./enc-string";
import { LoginUri } from "./login-uri";

export class Login {
  uris: LoginUri[];
  username: EncString;
  password: EncString;
  passwordRevisionDate?: Date;
  totp: EncString;
  autofillOnPageLoad: boolean;

  constructor(obj?: LoginData) {
    if (obj == null) {
      return;
    }

    this.passwordRevisionDate = nullableFactory(Date, obj.passwordRevisionDate);
    this.autofillOnPageLoad = obj.autofillOnPageLoad;

    this.username = nullableFactory(EncString, obj.username);
    this.password = nullableFactory(EncString, obj.password);
    this.totp = nullableFactory(EncString, obj.totp);

    if (obj.uris) {
      this.uris = [];
      obj.uris.forEach((u) => {
        this.uris.push(new LoginUri(u));
      });
    }
  }

  toLoginData(): LoginData {
    const data = new LoginData();

    data.passwordRevisionDate = this.passwordRevisionDate?.toISOString();
    data.autofillOnPageLoad = this.autofillOnPageLoad;
    data.username = this.username?.encryptedString;
    data.password = this.password?.encryptedString;
    data.totp = this.totp?.encryptedString;

    if (this.uris != null && this.uris.length > 0) {
      data.uris = [];
      this.uris.forEach((u) => {
        data.uris.push(u.toLoginUriData());
      });
    }

    return data;
  }

  static fromJSON(obj: Partial<Jsonify<Login>>): Login {
    if (obj == null) {
      return null;
    }

    const username = nullableFactory(EncString, obj.username);
    const password = nullableFactory(EncString, obj.password);
    const totp = nullableFactory(EncString, obj.totp);
    const passwordRevisionDate =
      obj.passwordRevisionDate == null ? null : new Date(obj.passwordRevisionDate);
    const uris = obj.uris?.map((uri: any) => LoginUri.fromJSON(uri));

    return Object.assign(new Login(), obj, {
      username,
      password,
      totp,
      passwordRevisionDate: passwordRevisionDate,
      uris: uris,
    });
  }
}

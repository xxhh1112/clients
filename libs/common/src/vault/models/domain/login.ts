import { Jsonify } from "type-fest";

import Domain from "../../../platform/models/domain/domain-base";
import { EncString } from "../../../platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { LoginData } from "../data/login.data";
import { LoginView } from "../view/login.view";

import { Fido2Key } from "./fido2-key";
import { LoginUri } from "./login-uri";

export class Login extends Domain {
  uris: LoginUri[];
  username: EncString;
  password: EncString;
  passwordRevisionDate?: Date;
  totp: EncString;
  autofillOnPageLoad: boolean;
  fido2Keys: Fido2Key[] = [];

  constructor(obj?: LoginData) {
    super();
    if (obj == null) {
      return;
    }

    this.passwordRevisionDate =
      obj.passwordRevisionDate != null ? new Date(obj.passwordRevisionDate) : null;
    this.autofillOnPageLoad = obj.autofillOnPageLoad;
    this.buildDomainModel(
      this,
      obj,
      {
        username: null,
        password: null,
        totp: null,
      },
      []
    );

    if (obj.uris) {
      this.uris = [];
      obj.uris.forEach((u) => {
        this.uris.push(new LoginUri(u));
      });
    }

    if (obj.fido2Keys) {
      this.fido2Keys = obj.fido2Keys.map((key) => new Fido2Key(key));
    }
  }

  async decrypt(orgId: string, encKey?: SymmetricCryptoKey): Promise<LoginView> {
    const view = await this.decryptObj(
      new LoginView(this),
      {
        username: null,
        password: null,
        totp: null,
      },
      orgId,
      encKey
    );

    if (this.uris != null) {
      view.uris = [];
      for (let i = 0; i < this.uris.length; i++) {
        const uri = await this.uris[i].decrypt(orgId, encKey);
        view.uris.push(uri);
      }
    }

    if (this.fido2Keys != null) {
      view.fido2Keys = await Promise.all(this.fido2Keys.map((key) => key.decrypt(orgId, encKey)));
    }

    return view;
  }

  toLoginData(): LoginData {
    const l = new LoginData();
    l.passwordRevisionDate =
      this.passwordRevisionDate != null ? this.passwordRevisionDate.toISOString() : null;
    l.autofillOnPageLoad = this.autofillOnPageLoad;
    this.buildDataModel(this, l, {
      username: null,
      password: null,
      totp: null,
    });

    if (this.uris != null && this.uris.length > 0) {
      l.uris = [];
      this.uris.forEach((u) => {
        l.uris.push(u.toLoginUriData());
      });
    }

    l.fido2Keys = this.fido2Keys.map((key) => key.toFido2KeyData());

    return l;
  }

  static fromJSON(obj: Partial<Jsonify<Login>>): Login {
    if (obj == null) {
      return null;
    }

    const username = EncString.fromJSON(obj.username);
    const password = EncString.fromJSON(obj.password);
    const totp = EncString.fromJSON(obj.totp);
    const passwordRevisionDate =
      obj.passwordRevisionDate == null ? null : new Date(obj.passwordRevisionDate);
    const uris = obj.uris?.map((uri: any) => LoginUri.fromJSON(uri));
    const fido2Keys = obj.fido2Keys?.map((key) => Fido2Key.fromJSON(key)) ?? [];

    return Object.assign(new Login(), obj, {
      username,
      password,
      totp,
      passwordRevisionDate,
      uris,
      fido2Keys,
    });
  }
}

import { Jsonify } from "type-fest";

import { UriMatchType } from "../../enums/uriMatchType";
import { nullableFactory } from "../../interfaces/crypto.interface";
import { LoginUriData } from "../data/login-uri.data";

import { EncString } from "./enc-string";

export class LoginUri {
  uri: EncString;
  match: UriMatchType;

  constructor(obj?: LoginUriData) {
    if (obj == null) {
      return;
    }

    this.match = obj.match;
    this.uri = nullableFactory(EncString, obj.uri);
  }

  // TODO: This should be moved into the LoginUriData
  toLoginUriData(): LoginUriData {
    const u = new LoginUriData();

    u.uri = this.uri?.encryptedString;
    u.match = this.match;

    return u;
  }

  static fromJSON(obj: Jsonify<LoginUri>): LoginUri {
    if (obj == null) {
      return null;
    }

    return Object.assign(new LoginUri(), obj, {
      uri: nullableFactory(EncString, obj.uri),
    });
  }
}

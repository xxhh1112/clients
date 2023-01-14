import { Jsonify } from "type-fest";

import { nullableFactory } from "../../interfaces/crypto.interface";
import { PasswordHistoryData } from "../data/password-history.data";

import { EncString } from "./enc-string";

export class Password {
  password: EncString;
  lastUsedDate: Date;

  constructor(obj?: PasswordHistoryData) {
    if (obj == null) {
      return;
    }

    this.password = nullableFactory(EncString, obj.password);
    this.lastUsedDate = new Date(obj.lastUsedDate);
  }

  toPasswordHistoryData(): PasswordHistoryData {
    const data = new PasswordHistoryData();

    data.lastUsedDate = this.lastUsedDate.toISOString();
    data.password = this.password?.encryptedString;

    return data;
  }

  static fromJSON(obj: Partial<Jsonify<Password>>): Password {
    if (obj == null) {
      return null;
    }

    return Object.assign(new Password(), obj, {
      password: nullableFactory(EncString, obj.password),
      lastUsedDate: nullableFactory(Date, obj.lastUsedDate),
    });
  }
}

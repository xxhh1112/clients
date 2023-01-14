import { Jsonify } from "type-fest";

import { nullableFactory } from "../../interfaces/crypto.interface";
import { CardData } from "../data/card.data";

import { EncString } from "./enc-string";

export class Card {
  cardholderName: EncString;
  brand: EncString;
  number: EncString;
  expMonth: EncString;
  expYear: EncString;
  code: EncString;

  constructor(obj?: CardData) {
    if (obj == null) {
      return;
    }

    this.cardholderName = nullableFactory(EncString, obj.cardholderName);
    this.brand = nullableFactory(EncString, obj.brand);
    this.number = nullableFactory(EncString, obj.number);
    this.expMonth = nullableFactory(EncString, obj.expMonth);
    this.expYear = nullableFactory(EncString, obj.expYear);
    this.code = nullableFactory(EncString, obj.code);
  }

  toCardData(): CardData {
    const data = new CardData();

    data.cardholderName = this.cardholderName?.encryptedString;
    data.brand = this.brand?.encryptedString;
    data.number = this.number?.encryptedString;
    data.expMonth = this.expMonth?.encryptedString;
    data.expYear = this.expYear?.encryptedString;
    data.code = this.code?.encryptedString;

    return data;
  }

  static fromJSON(obj: Partial<Jsonify<Card>>): Card {
    if (obj == null) {
      return null;
    }

    const cardholderName = nullableFactory(EncString, obj.cardholderName);
    const brand = nullableFactory(EncString, obj.brand);
    const number = nullableFactory(EncString, obj.number);
    const expMonth = nullableFactory(EncString, obj.expMonth);
    const expYear = nullableFactory(EncString, obj.expYear);
    const code = nullableFactory(EncString, obj.code);

    return Object.assign(new Card(), obj, {
      cardholderName,
      brand,
      number,
      expMonth,
      expYear,
      code,
    });
  }
}

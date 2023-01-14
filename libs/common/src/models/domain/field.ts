import { Jsonify } from "type-fest";

import { FieldType } from "../../enums/fieldType";
import { LinkedIdType } from "../../enums/linkedIdType";
import { nullableFactory } from "../../interfaces/crypto.interface";
import { FieldData } from "../data/field.data";

import { EncString } from "./enc-string";

export class Field {
  name: EncString;
  value: EncString;
  type: FieldType;
  linkedId: LinkedIdType;

  constructor(obj?: FieldData) {
    if (obj == null) {
      return;
    }

    this.type = obj.type;
    this.linkedId = obj.linkedId;
    this.name = nullableFactory(EncString, obj.name);
    this.value = nullableFactory(EncString, obj.value);
  }

  toFieldData(): FieldData {
    const data = new FieldData();

    data.type = this.type;
    data.linkedId = this.linkedId;
    data.name = this.name?.encryptedString;
    data.value = this.value?.encryptedString;

    return data;
  }

  static fromJSON(obj: Partial<Jsonify<Field>>): Field {
    if (obj == null) {
      return null;
    }

    return Object.assign(new Field(), obj, {
      name: nullableFactory(EncString, obj.name),
      value: nullableFactory(EncString, obj.value),
    });
  }
}

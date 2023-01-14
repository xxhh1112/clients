import { Jsonify } from "type-fest";

import { EncryptService } from "../../abstractions/encrypt.service";
import { FieldType } from "../../enums/fieldType";
import { LinkedIdType } from "../../enums/linkedIdType";
import { Field } from "../domain/field";
import { SymmetricCryptoKey } from "../domain/symmetric-crypto-key";

import { View } from "./view";

export class FieldView implements View {
  name: string = null;
  value: string = null;
  type: FieldType = null;
  newField = false; // Marks if the field is new and hasn't been saved
  showValue = false;
  showCount = false;
  linkedId: LinkedIdType = null;

  get maskedValue(): string {
    return this.value != null ? "••••••••" : null;
  }

  async encrypt(encryptService: EncryptService, key: SymmetricCryptoKey): Promise<Field> {
    const field = new Field();

    field.type = this.type;
    field.linkedId = this.linkedId;

    // normalize boolean type field values
    if (this.type === FieldType.Boolean && this.value !== "true") {
      this.value = "false";
    }

    field.name = this.name != null ? await encryptService.encrypt(this.name, key) : null;
    field.value = this.value != null ? await encryptService.encrypt(this.value, key) : null;

    return field;
  }

  static fromJSON(obj: Partial<Jsonify<FieldView>>): FieldView {
    return Object.assign(new FieldView(), obj);
  }

  static async decrypt(encryptService: EncryptService, key: SymmetricCryptoKey, model: Field) {
    const view = new FieldView();

    view.type = model.type;
    view.linkedId = model.linkedId;
    view.name = await model.name?.decryptWithEncryptService(encryptService, key);
    view.value = await model.value?.decryptWithEncryptService(encryptService, key);

    return view;
  }
}

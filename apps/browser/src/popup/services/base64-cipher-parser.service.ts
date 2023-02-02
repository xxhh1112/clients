import { FieldType } from "@bitwarden/common/enums/fieldType";
import { Utils } from "@bitwarden/common/misc/utils";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CardView } from "@bitwarden/common/vault/models/view/card.view";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { FieldView } from "@bitwarden/common/vault/models/view/field.view";
import { LoginView } from "@bitwarden/common/vault/models/view/login.view";

export type Base64ParsedType = {
  title: string;
  fields: Field[];
  notes: string;
};

export type Field = {
  autocomplete: string;
  value: string;
};

export class Base64CipherParser {
  parse(cipherType: CipherType, base64String: string): CipherView {
    try {
      const parsedData = this.parseBase64String(base64String);
      if (parsedData == null) {
        return null;
      }

      return this.parseInternal(cipherType, parsedData);
    } catch (e) {
      return null;
    }
  }

  private parseBase64String(base64String: string): Base64ParsedType {
    try {
      const tempCipherString = Utils.fromB64ToUtf8(base64String);
      const tempCipher: Base64ParsedType = JSON.parse(tempCipherString);
      return tempCipher;
    } catch (e) {
      return null;
    }
  }

  private parseInternal(cipherType: CipherType, data: Base64ParsedType): CipherView {
    const cipher = this.createBaseCipherView();
    cipher.name = data.title;
    cipher.notes = data.notes;

    switch (cipherType) {
      case CipherType.Login:
        cipher.type = CipherType.Login;
        cipher.login = new LoginView();

        data.fields.forEach((f) => {
          if (f.autocomplete == "username" && cipher.login.username == null) {
            cipher.login.username = f.value;
            return;
          }

          if (f.autocomplete == "current-password" && cipher.login.password == null) {
            cipher.login.password = f.value;
            return;
          }

          // if (f.autocomplete == "url" && !cipher.login.hasUris) {
          //   cipher.login.uris[0].uri = f.value;
          //   return;
          // }
        });
        break;
      case CipherType.Card:
        cipher.type = CipherType.Card;
        cipher.card = new CardView();

        data.fields.forEach((f) => {
          if (f.autocomplete == "cc-name" && cipher.card.cardholderName == null) {
            cipher.card.cardholderName = f.value;
            return;
          }

          if (f.autocomplete == "cc-number" && cipher.card.number == null) {
            cipher.card.number = f.value;
            return;
          }

          if (f.autocomplete == "cc-type" && cipher.card.brand == null) {
            cipher.card.brand = f.value.toLowerCase();
            return;
          }

          if (f.autocomplete == "cc-exp") {
            // cipher.card.expiration = f.value;
            return;
          }

          if (f.autocomplete == "cc-csc" && cipher.card.code == null) {
            cipher.card.code = f.value;
            return;
          }

          this.processKvp(cipher, f.autocomplete, f.value);
        });
        break;

      default:
        break;
    }
    return cipher;
  }

  private createBaseCipherView(): CipherView {
    const cipher = new CipherView();
    cipher.favorite = false;
    cipher.notes = "";
    cipher.fields = [];
    return cipher;
  }

  private processKvp(
    cipher: CipherView,
    key: string,
    value: string,
    type: FieldType = FieldType.Text
  ) {
    if (Utils.isNullOrWhitespace(value)) {
      return;
    }
    if (Utils.isNullOrWhitespace(key)) {
      key = "";
    }
    // if (value.length > 200 || value.trim().search(this.newLineRegex) > -1) {
    //   if (cipher.notes == null) {
    //     cipher.notes = "";
    //   }
    //   cipher.notes += key + ": " + this.splitNewLine(value).join("\n") + "\n";
    // } else {
    if (cipher.fields == null) {
      cipher.fields = [];
    }
    const field = new FieldView();
    field.type = type;
    field.name = key;
    field.value = value;
    cipher.fields.push(field);
    // }
  }
}

import { ItemView } from "./item.view";

export class Fido2KeyView extends ItemView {
  keyType: "ECDSA";
  keyCurve: "P-256";
  keyValue: string;
  rpId: string;
  rpName: string;
  userHandle: string;
  userName: string;
  origin: string;

  get subTitle(): string {
    return null;
  }
}

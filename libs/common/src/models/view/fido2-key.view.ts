import { ItemView } from "./item.view";

export class Fido2KeyView extends ItemView {
  key: string;
  rpId: string;
  origin: string;
  userHandle: string;

  get subTitle(): string {
    return null;
  }
}

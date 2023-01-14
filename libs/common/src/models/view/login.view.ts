import { Jsonify } from "type-fest";

import { EncryptService } from "../../abstractions/encrypt.service";
import { LoginLinkedId as LinkedId } from "../../enums/linkedIdType";
import { nullableFactory } from "../../interfaces/crypto.interface";
import { Utils } from "../../misc/utils";
import { Login } from "../domain/login";
import { SymmetricCryptoKey } from "../domain/symmetric-crypto-key";

import { ItemView } from "./item.view";
import { linkedFieldOption } from "./linked-field-option.decorator";
import { LoginUriView } from "./login-uri.view";

export class LoginView extends ItemView {
  @linkedFieldOption(LinkedId.Username)
  username: string = null;
  @linkedFieldOption(LinkedId.Password)
  password: string = null;

  passwordRevisionDate?: Date = null;
  totp: string = null;
  uris: LoginUriView[] = null;
  autofillOnPageLoad: boolean = null;

  constructor(l?: Login) {
    super();
    if (!l) {
      return;
    }

    this.passwordRevisionDate = l.passwordRevisionDate;
    this.autofillOnPageLoad = l.autofillOnPageLoad;
  }

  get uri(): string {
    return this.hasUris ? this.uris[0].uri : null;
  }

  get maskedPassword(): string {
    return this.password != null ? "••••••••" : null;
  }

  get subTitle(): string {
    return this.username;
  }

  get canLaunch(): boolean {
    return this.hasUris && this.uris.some((u) => u.canLaunch);
  }

  get hasTotp(): boolean {
    return !Utils.isNullOrWhitespace(this.totp);
  }

  get launchUri(): string {
    if (this.hasUris) {
      const uri = this.uris.find((u) => u.canLaunch);
      if (uri != null) {
        return uri.launchUri;
      }
    }
    return null;
  }

  get hasUris(): boolean {
    return this.uris != null && this.uris.length > 0;
  }

  async encrypt(encryptService: EncryptService, key: SymmetricCryptoKey): Promise<Login> {
    const login = new Login();

    login.passwordRevisionDate = this.passwordRevisionDate;
    login.autofillOnPageLoad = this.autofillOnPageLoad;

    [login.username, login.password, login.totp] = await Promise.all([
      this.username ? encryptService.encrypt(this.username, key) : null,
      this.password ? encryptService.encrypt(this.password, key) : null,
      this.totp ? encryptService.encrypt(this.totp, key) : null,
    ]);

    return login;
  }

  static fromJSON(obj: Partial<Jsonify<LoginView>>): LoginView {
    const passwordRevisionDate = nullableFactory(Date, obj.passwordRevisionDate);
    const uris = obj.uris?.map((uri: any) => LoginUriView.fromJSON(uri));

    return Object.assign(new LoginView(), obj, {
      passwordRevisionDate: passwordRevisionDate,
      uris: uris,
    });
  }

  static async decrypt(encryptService: EncryptService, key: SymmetricCryptoKey, model: Login) {
    const view = new LoginView();

    view.passwordRevisionDate = model.passwordRevisionDate;
    view.autofillOnPageLoad = model.autofillOnPageLoad;

    view.username = await model.username?.decryptWithEncryptService(encryptService, key);
    view.password = await model.username?.decryptWithEncryptService(encryptService, key);
    view.totp = await model.totp?.decryptWithEncryptService(encryptService, key);

    if (model.uris?.length > 0) {
      view.uris = await Promise.all(
        model.uris?.map((uri) => LoginUriView.decrypt(encryptService, key, uri))
      );
    } else {
      view.uris = [];
    }

    return view;
  }
}

import { Jsonify } from "type-fest";

import { EncryptService } from "../../abstractions/encrypt.service";
import { CipherRepromptType } from "../../enums/cipherRepromptType";
import { CipherType } from "../../enums/cipherType";
import { LinkedIdType } from "../../enums/linkedIdType";
import { Encryptable, nullableFactory } from "../../interfaces/crypto.interface";
import { InitializerKey } from "../../services/cryptography/initializer-key";
import { LocalData } from "../data/local.data";
import { Cipher } from "../domain/cipher";
import { SymmetricCryptoKey } from "../domain/symmetric-crypto-key";

import { AttachmentView } from "./attachment.view";
import { CardView } from "./card.view";
import { FieldView } from "./field.view";
import { IdentityView } from "./identity.view";
import { LoginView } from "./login.view";
import { PasswordHistoryView } from "./password-history.view";
import { SecureNoteView } from "./secure-note.view";

export class CipherView implements Encryptable<Cipher> {
  static readonly initializerKey = InitializerKey.CipherView;

  id: string = null;
  organizationId: string = null;
  folderId: string = null;
  name: string = null;
  notes: string = null;
  type: CipherType = null;
  favorite = false;
  organizationUseTotp = false;
  edit = false;
  viewPassword = true;
  localData: LocalData;
  login = new LoginView();
  identity = new IdentityView();
  card = new CardView();
  secureNote = new SecureNoteView();
  attachments: AttachmentView[] = null;
  fields: FieldView[] = null;
  passwordHistory: PasswordHistoryView[] = null;
  collectionIds: string[] = null;
  revisionDate: Date = null;
  creationDate: Date = null;
  deletedDate: Date = null;
  reprompt: CipherRepromptType = CipherRepromptType.None;

  keyIdentifier(): string | null {
    return this.organizationId || null;
  }

  async encrypt(encryptService: EncryptService, key: SymmetricCryptoKey): Promise<Cipher> {
    const cipher = new Cipher();
    cipher.id = this.id;
    cipher.organizationId = this.organizationId;
    cipher.folderId = this.folderId;
    cipher.name = this.name != null ? await encryptService.encrypt(this.name, key) : null;
    cipher.notes = this.notes != null ? await encryptService.encrypt(this.notes, key) : null;
    cipher.type = this.type;
    cipher.favorite = this.favorite;
    //cipher.organizationUseTotp = this.organizationUseTotp;
    cipher.edit = this.edit;
    //cipher.viewPassword = this.viewPassword;
    //cipher.localData = this.localData;

    switch (this.type) {
      case CipherType.Login:
        cipher.login = await this.login.encrypt(encryptService, key);
        break;
      case CipherType.Identity:
        cipher.identity = await this.identity.encrypt(encryptService, key);
        break;
      case CipherType.Card:
        cipher.card = await this.card.encrypt(encryptService, key);
        break;
      case CipherType.SecureNote:
        cipher.secureNote = await this.secureNote.encrypt(encryptService, key);
        break;
      default:
        break;
    }

    cipher.attachments = await Promise.all(
      this.attachments?.map((a) => a.encrypt(encryptService, key)) ?? []
    );

    cipher.fields = await Promise.all(
      this.fields?.map((f) => f.encrypt(encryptService, key)) ?? []
    );

    cipher.passwordHistory = await Promise.all(
      this.passwordHistory?.map((p) => p.encrypt(encryptService, key)) ?? []
    );

    cipher.collectionIds = this.collectionIds;
    cipher.revisionDate = this.revisionDate;
    //cipher.creationDate = this.creationDate;
    //cipher.deletedDate = this.deletedDate;
    cipher.reprompt = this.reprompt;

    return cipher;
  }

  private get item() {
    switch (this.type) {
      case CipherType.Login:
        return this.login;
      case CipherType.SecureNote:
        return this.secureNote;
      case CipherType.Card:
        return this.card;
      case CipherType.Identity:
        return this.identity;
      default:
        break;
    }

    return null;
  }

  get subTitle(): string {
    return this.item.subTitle;
  }

  get hasPasswordHistory(): boolean {
    return this.passwordHistory && this.passwordHistory.length > 0;
  }

  get hasAttachments(): boolean {
    return this.attachments && this.attachments.length > 0;
  }

  get hasOldAttachments(): boolean {
    if (this.hasAttachments) {
      for (let i = 0; i < this.attachments.length; i++) {
        if (this.attachments[i].key == null) {
          return true;
        }
      }
    }
    return false;
  }

  get hasFields(): boolean {
    return this.fields && this.fields.length > 0;
  }

  get passwordRevisionDisplayDate(): Date {
    if (this.type !== CipherType.Login || this.login == null) {
      return null;
    } else if (this.login.password == null || this.login.password === "") {
      return null;
    }
    return this.login.passwordRevisionDate;
  }

  get isDeleted(): boolean {
    return this.deletedDate != null;
  }

  get linkedFieldOptions() {
    return this.item.linkedFieldOptions;
  }

  linkedFieldValue(id: LinkedIdType) {
    const linkedFieldOption = this.linkedFieldOptions?.get(id);
    if (linkedFieldOption == null) {
      return null;
    }

    const item = this.item;
    return this.item[linkedFieldOption.propertyKey as keyof typeof item];
  }

  linkedFieldI18nKey(id: LinkedIdType): string {
    return this.linkedFieldOptions.get(id)?.i18nKey;
  }

  static fromJSON(obj: Partial<Jsonify<CipherView>>): CipherView {
    const view = new CipherView();
    const revisionDate = nullableFactory(Date, obj.revisionDate);
    const deletedDate = nullableFactory(Date, obj.deletedDate);
    const attachments = obj.attachments?.map((a: any) => AttachmentView.fromJSON(a));
    const fields = obj.fields?.map((f: any) => FieldView.fromJSON(f));
    const passwordHistory = obj.passwordHistory?.map((ph: any) => PasswordHistoryView.fromJSON(ph));

    Object.assign(view, obj, {
      revisionDate: revisionDate,
      deletedDate: deletedDate,
      attachments: attachments,
      fields: fields,
      passwordHistory: passwordHistory,
    });

    switch (obj.type) {
      case CipherType.Card:
        view.card = CardView.fromJSON(obj.card);
        break;
      case CipherType.Identity:
        view.identity = IdentityView.fromJSON(obj.identity);
        break;
      case CipherType.Login:
        view.login = LoginView.fromJSON(obj.login);
        break;
      case CipherType.SecureNote:
        view.secureNote = SecureNoteView.fromJSON(obj.secureNote);
        break;
      default:
        break;
    }

    return view;
  }

  static async decrypt(encryptService: EncryptService, key: SymmetricCryptoKey, model: Cipher) {
    const view = new CipherView();

    view.id = model.id;
    view.organizationId = model.organizationId;
    view.folderId = model.folderId;
    view.favorite = model.favorite;
    view.organizationUseTotp = model.organizationUseTotp;
    view.edit = model.edit;
    view.viewPassword = model.viewPassword;
    view.type = model.type;
    view.localData = model.localData;
    view.collectionIds = model.collectionIds;
    view.revisionDate = model.revisionDate;
    view.creationDate = model.creationDate;
    view.deletedDate = model.deletedDate;
    // Old locally stored ciphers might have reprompt == null. If so set it to None.
    view.reprompt = model.reprompt ?? CipherRepromptType.None;

    view.name = await model.name?.decryptWithEncryptService(encryptService, key);
    view.notes = await model.notes?.decryptWithEncryptService(encryptService, key);

    switch (model.type) {
      case CipherType.Login:
        view.login = await LoginView.decrypt(encryptService, key, model.login);
        break;
      case CipherType.SecureNote:
        view.secureNote = await SecureNoteView.decrypt(encryptService, key, model.secureNote);
        break;
      case CipherType.Card:
        view.card = await CardView.decrypt(encryptService, key, model.card);
        break;
      case CipherType.Identity:
        view.identity = await IdentityView.decrypt(encryptService, key, model.identity);
        break;
      default:
        break;
    }

    if (model.attachments?.length > 0) {
      view.attachments = await Promise.all(
        model.attachments.map((a) => {
          return AttachmentView.decrypt(encryptService, key, a);
        })
      );
    }

    if (model.fields?.length > 0) {
      view.fields = await Promise.all(
        model.fields.map((f) => {
          return FieldView.decrypt(encryptService, key, f);
        })
      );
    }

    if (model.passwordHistory?.length > 0) {
      view.passwordHistory = await Promise.all(
        model.passwordHistory.map((f) => {
          return PasswordHistoryView.decrypt(encryptService, key, f);
        })
      );
    }

    return view;
  }
}

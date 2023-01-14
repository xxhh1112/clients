import { Jsonify } from "type-fest";

import { CipherRepromptType } from "../../enums/cipherRepromptType";
import { CipherType } from "../../enums/cipherType";
import { DecryptableDomain, nullableFactory } from "../../interfaces/crypto.interface";
import { InitializerMetadata } from "../../interfaces/initializer-metadata.interface";
import { InitializerKey } from "../../services/cryptography/initializer-key";
import { CipherData } from "../data/cipher.data";
import { LocalData } from "../data/local.data";

import { Attachment } from "./attachment";
import { Card } from "./card";
import { EncString } from "./enc-string";
import { Field } from "./field";
import { Identity } from "./identity";
import { Login } from "./login";
import { Password } from "./password";
import { SecureNote } from "./secure-note";

export class Cipher implements DecryptableDomain, InitializerMetadata {
  readonly initializerKey = InitializerKey.Cipher;

  id: string;
  organizationId: string;
  folderId: string;
  name: EncString;
  notes: EncString;
  type: CipherType;
  favorite: boolean;
  organizationUseTotp: boolean;
  edit: boolean;
  viewPassword: boolean;
  revisionDate: Date;
  localData: LocalData;
  login: Login;
  identity: Identity;
  card: Card;
  secureNote: SecureNote;
  attachments: Attachment[];
  fields: Field[];
  passwordHistory: Password[];
  collectionIds: string[];
  creationDate: Date;
  deletedDate: Date;
  reprompt: CipherRepromptType;

  constructor(obj?: CipherData, localData: LocalData = null) {
    if (obj == null) {
      return;
    }

    this.id = obj.id;
    this.organizationId = obj.organizationId;
    this.folderId = obj.folderId;
    this.name = nullableFactory(EncString, obj.name);
    this.notes = nullableFactory(EncString, obj.notes);
    this.type = obj.type;
    this.favorite = obj.favorite;
    this.organizationUseTotp = obj.organizationUseTotp;
    this.edit = obj.edit;
    this.viewPassword = obj.viewPassword ?? true;
    this.revisionDate = nullableFactory(Date, obj.revisionDate);
    this.collectionIds = obj.collectionIds;
    this.localData = localData;
    this.creationDate = nullableFactory(Date, obj.creationDate);
    this.deletedDate = nullableFactory(Date, obj.deletedDate);
    this.reprompt = obj.reprompt;

    switch (this.type) {
      case CipherType.Login:
        this.login = new Login(obj.login);
        break;
      case CipherType.SecureNote:
        this.secureNote = new SecureNote(obj.secureNote);
        break;
      case CipherType.Card:
        this.card = new Card(obj.card);
        break;
      case CipherType.Identity:
        this.identity = new Identity(obj.identity);
        break;
      default:
        break;
    }

    if (obj.attachments != null) {
      this.attachments = obj.attachments.map((a) => new Attachment(a));
    } else {
      this.attachments = null;
    }

    if (obj.fields != null) {
      this.fields = obj.fields.map((f) => new Field(f));
    } else {
      this.fields = null;
    }

    if (obj.passwordHistory != null) {
      this.passwordHistory = obj.passwordHistory.map((ph) => new Password(ph));
    } else {
      this.passwordHistory = null;
    }
  }

  keyIdentifier(): string {
    return this.organizationId || null;
  }

  // TODO: This should be moved into the CipherData
  toCipherData(): CipherData {
    const c = new CipherData();
    c.id = this.id;
    c.organizationId = this.organizationId;
    c.folderId = this.folderId;
    c.edit = this.edit;
    c.viewPassword = this.viewPassword;
    c.organizationUseTotp = this.organizationUseTotp;
    c.favorite = this.favorite;
    c.revisionDate = this.revisionDate != null ? this.revisionDate.toISOString() : null;
    c.type = this.type;
    c.collectionIds = this.collectionIds;
    c.creationDate = this.creationDate != null ? this.creationDate.toISOString() : null;
    c.deletedDate = this.deletedDate != null ? this.deletedDate.toISOString() : null;
    c.reprompt = this.reprompt;

    c.name = this.name?.encryptedString;
    c.notes = this.notes?.encryptedString;

    switch (c.type) {
      case CipherType.Login:
        c.login = this.login.toLoginData();
        break;
      case CipherType.SecureNote:
        c.secureNote = this.secureNote.toSecureNoteData();
        break;
      case CipherType.Card:
        c.card = this.card.toCardData();
        break;
      case CipherType.Identity:
        c.identity = this.identity.toIdentityData();
        break;
      default:
        break;
    }

    if (this.fields != null) {
      c.fields = this.fields.map((f) => f.toFieldData());
    }
    if (this.attachments != null) {
      c.attachments = this.attachments.map((a) => a.toAttachmentData());
    }
    if (this.passwordHistory != null) {
      c.passwordHistory = this.passwordHistory.map((ph) => ph.toPasswordHistoryData());
    }
    return c;
  }

  static fromJSON(obj: Jsonify<Cipher>) {
    if (obj == null) {
      return null;
    }

    const domain = new Cipher();
    const name = nullableFactory(EncString, obj.name);
    const notes = nullableFactory(EncString, obj.notes);
    const revisionDate = nullableFactory(Date, obj.revisionDate);
    const deletedDate = nullableFactory(Date, obj.deletedDate);
    const attachments = obj.attachments?.map((a: any) => Attachment.fromJSON(a));
    const fields = obj.fields?.map((f: any) => Field.fromJSON(f));
    const passwordHistory = obj.passwordHistory?.map((ph: any) => Password.fromJSON(ph));

    Object.assign(domain, obj, {
      name,
      notes,
      revisionDate,
      deletedDate,
      attachments,
      fields,
      passwordHistory,
    });

    switch (obj.type) {
      case CipherType.Card:
        domain.card = Card.fromJSON(obj.card);
        break;
      case CipherType.Identity:
        domain.identity = Identity.fromJSON(obj.identity);
        break;
      case CipherType.Login:
        domain.login = Login.fromJSON(obj.login);
        break;
      case CipherType.SecureNote:
        domain.secureNote = SecureNote.fromJSON(obj.secureNote);
        break;
      default:
        break;
    }

    return domain;
  }
}

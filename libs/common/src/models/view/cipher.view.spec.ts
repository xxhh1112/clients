import { mockEnc, mockFromJson } from "../../../spec/utils";
import { CipherRepromptType } from "../../enums/cipherRepromptType";
import { CipherType } from "../../enums/cipherType";
import { SecureNoteType } from "../../enums/secureNoteType";
import { Cipher } from "../domain/cipher";
import { Identity } from "../domain/identity";
import { SecureNote } from "../domain/secure-note";

import { AttachmentView } from "./attachment.view";
import { CardView } from "./card.view";
import { CipherView } from "./cipher.view";
import { FieldView } from "./field.view";
import { IdentityView } from "./identity.view";
import { LoginView } from "./login.view";
import { PasswordHistoryView } from "./password-history.view";
import { SecureNoteView } from "./secure-note.view";

jest.mock("./attachment.view");
jest.mock("./card.view");
jest.mock("./field.view");
jest.mock("./login.view");
jest.mock("./password-history.view");

describe("CipherView", () => {
  beforeEach(() => {
    (LoginView as any).mockClear();
    (AttachmentView as any).mockClear();
    (FieldView as any).mockClear();
    (PasswordHistoryView as any).mockClear();
  });

  describe("fromJSON", () => {
    it("initializes nested objects", () => {
      jest.spyOn(AttachmentView, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(FieldView, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(PasswordHistoryView, "fromJSON").mockImplementation(mockFromJson);

      const revisionDate = new Date("2022-08-04T01:06:40.441Z");
      const deletedDate = new Date("2022-09-04T01:06:40.441Z");
      const actual = CipherView.fromJSON({
        revisionDate: revisionDate.toISOString(),
        deletedDate: deletedDate.toISOString(),
        attachments: ["attachment1", "attachment2"] as any,
        fields: ["field1", "field2"] as any,
        passwordHistory: ["ph1", "ph2", "ph3"] as any,
      });

      const expected = {
        revisionDate: revisionDate,
        deletedDate: deletedDate,
        attachments: ["attachment1_fromJSON", "attachment2_fromJSON"],
        fields: ["field1_fromJSON", "field2_fromJSON"],
        passwordHistory: ["ph1_fromJSON", "ph2_fromJSON", "ph3_fromJSON"],
      };

      expect(actual).toMatchObject(expected);
    });

    test.each([
      // Test description, CipherType, expected output
      ["LoginView", CipherType.Login, { login: "myLogin_fromJSON" }],
      ["CardView", CipherType.Card, { card: "myCard_fromJSON" }],
      ["IdentityView", CipherType.Identity, { identity: "myIdentity_fromJSON" }],
      ["Secure Note", CipherType.SecureNote, { secureNote: "mySecureNote_fromJSON" }],
    ])("initializes %s", (description: string, cipherType: CipherType, expected: any) => {
      jest.spyOn(LoginView, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(IdentityView, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(CardView, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(SecureNoteView, "fromJSON").mockImplementation(mockFromJson);

      const actual = CipherView.fromJSON({
        login: "myLogin",
        card: "myCard",
        identity: "myIdentity",
        secureNote: "mySecureNote",
        type: cipherType,
      } as any);

      expect(actual).toMatchObject(expected);
    });
  });

  describe("Decrypt", () => {
    let cipher: Cipher;

    beforeEach(() => {
      cipher = new Cipher();
      cipher.id = "id";
      cipher.organizationId = "orgId";
      cipher.folderId = "folderId";
      cipher.edit = true;
      cipher.viewPassword = true;
      cipher.organizationUseTotp = true;
      cipher.favorite = false;
      cipher.revisionDate = new Date("2022-01-31T12:00:00.000Z");
      cipher.name = mockEnc("EncryptedString");
      cipher.notes = mockEnc("EncryptedString");
      cipher.creationDate = new Date("2022-01-01T12:00:00.000Z");
      cipher.deletedDate = null;
      cipher.reprompt = CipherRepromptType.None;
    });

    it("Login", async () => {
      cipher.type = CipherType.Login;

      const loginView = new LoginView();
      loginView.username = "username";
      loginView.password = "password";

      jest.spyOn(LoginView, "decrypt").mockImplementation(() => Promise.resolve(loginView));

      const cipherView = await CipherView.decrypt(null, null, cipher);

      expect(cipherView).toMatchObject({
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: "EncryptedString",
        notes: "EncryptedString",
        type: 1,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        login: loginView,
        attachments: null,
        fields: null,
        passwordHistory: null,
        collectionIds: undefined,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        localData: undefined,
      });
    });

    it("SecureNote", async () => {
      cipher.type = CipherType.SecureNote;

      cipher.secureNote = new SecureNote();
      cipher.secureNote.type = SecureNoteType.Generic;

      const cipherView = await CipherView.decrypt(null, null, cipher);

      expect(cipherView).toMatchObject({
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: "EncryptedString",
        notes: "EncryptedString",
        type: 2,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        secureNote: { type: 0 },
        attachments: null,
        fields: null,
        passwordHistory: null,
        collectionIds: undefined,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        localData: undefined,
      });
    });

    it("Card", async () => {
      cipher.type = CipherType.Card;

      const cardView = new CardView();
      cardView.cardholderName = "cardholderName";
      cardView.number = "4111111111111111";

      jest.spyOn(CardView, "decrypt").mockImplementation(() => Promise.resolve(cardView));

      const cipherView = await CipherView.decrypt(null, null, cipher);

      expect(cipherView).toMatchObject({
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: "EncryptedString",
        notes: "EncryptedString",
        type: 3,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        card: cardView,
        attachments: null,
        fields: null,
        passwordHistory: null,
        collectionIds: undefined,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        localData: undefined,
      });
    });

    it("Identity", async () => {
      cipher.type = CipherType.Identity;

      const identityView = new IdentityView();
      identityView.firstName = "firstName";
      identityView.lastName = "lastName";

      jest.spyOn(IdentityView, "decrypt").mockImplementation(() => Promise.resolve(identityView));

      const identity = new Identity();
      cipher.identity = identity;
      const cipherView = await CipherView.decrypt(null, null, cipher);

      expect(cipherView).toMatchObject({
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: "EncryptedString",
        notes: "EncryptedString",
        type: 4,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        identity: identityView,
        attachments: null,
        fields: null,
        passwordHistory: null,
        collectionIds: undefined,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        localData: undefined,
      });
    });
  });
});

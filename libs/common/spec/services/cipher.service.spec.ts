import { Arg, Substitute, SubstituteOf } from "@fluffy-spoon/substitute";
import { firstValueFrom, BehaviorSubject } from "rxjs";

import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { SettingsService } from "@bitwarden/common/abstractions/settings.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { CipherRepromptType } from "@bitwarden/common/enums/cipherRepromptType";
import { CipherType } from "@bitwarden/common/enums/cipherType";
import { FieldType } from "@bitwarden/common/enums/fieldType";
import { UriMatchType } from "@bitwarden/common/enums/uriMatchType";
import { Utils } from "@bitwarden/common/misc/utils";
import { CipherData } from "@bitwarden/common/models/data/cipherData";
import { EncString } from "@bitwarden/common/models/domain/encString";
import { CipherView } from "@bitwarden/common/models/view/cipherView";
import { CipherService } from "@bitwarden/common/services/cipher/cipher.service";
import { ContainerService } from "@bitwarden/common/services/container.service";

// describe("Cipher Service", () => {
//   let cryptoService: SubstituteOf<CryptoService>;
//   let apiService: SubstituteOf<ApiService>;
//   let fileUploadService: SubstituteOf<FileUploadService>;
//   let cipherService: SubstituteOf<InternalCipherService>;

//   let cipherApiAttachmentService: CipherApiAttachmentService;

//   beforeEach(() => {
//     cryptoService = Substitute.for<CryptoService>();
//     apiService = Substitute.for<ApiService>();
//     fileUploadService = Substitute.for<FileUploadService>();
//     cipherService = Substitute.for<InternalCipherService>();

//     cryptoService.encryptToBytes(Arg.any(), Arg.any()).resolves(ENCRYPTED_BYTES);
//     cryptoService.encrypt(Arg.any(), Arg.any()).resolves(new EncString(ENCRYPTED_TEXT));

//     cipherApiAttachmentService = new CipherApiAttachmentService(
//       cipherService,
//       apiService,
//       cryptoService,
//       fileUploadService
//     );
//   });

//   it("attachments upload encrypted file contents", async () => {
//     const fileName = "filename";
//     const fileData = new Uint8Array(10).buffer;
//     cryptoService.getOrgKey(Arg.any()).resolves(new SymmetricCryptoKey(new Uint8Array(32).buffer));

//     await cipherApiAttachmentService.saveAttachmentRawWithServer(new Cipher(), fileName, fileData);

//     fileUploadService
//       .received(1)
//       .uploadCipherAttachment(Arg.any(), Arg.any(), new EncString(ENCRYPTED_TEXT), ENCRYPTED_BYTES);
//   });
// });

describe("Cipher Service", () => {
  let cipherService: CipherService;
  let activeAccountUnlocked: BehaviorSubject<boolean>;
  let activeAccount: BehaviorSubject<string>;
  let stateService: SubstituteOf<StateService>;
  let cryptoService: SubstituteOf<CryptoService>;
  let i18nService: SubstituteOf<I18nService>;
  let settingsService: SubstituteOf<SettingsService>;
  let logService: SubstituteOf<LogService>;

  beforeEach(() => {
    cryptoService = Substitute.for();
    settingsService = Substitute.for();
    i18nService = Substitute.for();
    logService = Substitute.for();
    stateService = Substitute.for();
    activeAccount = new BehaviorSubject("123");
    activeAccountUnlocked = new BehaviorSubject(true);

    stateService.getEncryptedCiphers().resolves({ "1": cipherData("1", "test") });

    stateService.activeAccount$.returns(activeAccount);
    stateService.activeAccountUnlocked$.returns(activeAccountUnlocked);
    (window as any).bitwardenContainerService = new ContainerService(cryptoService);

    cipherService = new CipherService(
      cryptoService,
      settingsService,
      i18nService,
      logService,
      stateService
    );
    cipherService.get;
  });

  describe("getAllDecryptedForGrouping$", () => {
    const getAllDecrypted$ = new BehaviorSubject(null);
    const folderId = Utils.newGuid();
    const collectionId = Utils.newGuid();

    beforeEach(() => {
      (cipherService as any).cipherViews$ = getAllDecrypted$;

      getAllDecrypted$.next([
        {
          name: "deleted, in folder, in collection",
          isDeleted: true,
          folderId: folderId,
          collectionIds: [collectionId],
        },
        {
          name: "in folder, in collection",
          isDeleted: false,
          folderId: folderId,
          collectionIds: [collectionId],
        },
        {
          name: "in folder, not in collection",
          isDeleted: false,
          folderId: folderId,
          collectionIds: [Utils.newGuid()],
        },
        {
          name: "not in folder, in collection",
          isDeleted: false,
          folderId: Utils.newGuid(),
          collectionIds: [collectionId],
        },
        {
          name: "not in folder, not in collection",
          isDeleted: false,
          folderId: Utils.newGuid(),
          collectionIds: [Utils.newGuid()],
        },
        {
          name: "not in folder, in collection, multiple collections",
          isDeleted: false,
          folderId: Utils.newGuid(),
          collectionIds: [collectionId, Utils.newGuid()],
        },
      ]);
    });

    it("should return decrypted ciphers for a given folder", async () => {
      const actual = await firstValueFrom(
        cipherService.getAllDecryptedForGrouping$(folderId, true)
      );

      expect(actual.map((c) => c.name)).toEqual([
        "in folder, in collection",
        "in folder, not in collection",
      ]);
    });

    it("should return decrypted ciphers for a given collection", async () => {
      const actual = await firstValueFrom(
        cipherService.getAllDecryptedForGrouping$(collectionId, false)
      );

      expect(actual.map((c) => c.name)).toEqual([
        "in folder, in collection",
        "not in folder, in collection",
        "not in folder, in collection, multiple collections",
      ]);
    });
  });

  describe("getAllDecryptedForUrl$", () => {
    let url: string;
    let includeOtherTypes: CipherType[] = [];
    let defaultMatch: UriMatchType;
    const getAllDecrypted$ = new BehaviorSubject(null);

    beforeEach(() => {
      url = "http://localhost";
      includeOtherTypes = null;
      defaultMatch = UriMatchType.Exact;
      stateService = Substitute.for();
      (cipherService as any).cipherViews$ = getAllDecrypted$;

      getAllDecrypted$.next([
        getcipherData("23", "http://localhost"),
        getcipherData("24", "www.google.com"),
      ]);
    });

    it("should return decrypted ciphers for a given url and UriMatchType", async () => {
      const actual = await firstValueFrom(
        cipherService.getAllDecryptedForUrl$(url, includeOtherTypes, defaultMatch)
      );

      expect(actual.map((c) => c.id)).toEqual(["23"]);
    });
  });

  describe("getAllDecrypted$", () => {
    const getAllDecrypted$ = new BehaviorSubject(null);

    beforeEach(() => {
      (cipherService as any).cipherViews$ = getAllDecrypted$;

      getAllDecrypted$.next([
        getcipherData("23", "http://localhost"),
        getcipherData("24", "www.google.com"),
        getcipherData("24", "www.goal.com"),
      ]);
    });

    it("Count of CipherView In The Return List", async () => {
      const actual = await firstValueFrom(cipherService.getAllDecrypted$());

      expect(actual.length).toEqual(3);
    });
  });

  describe("getAll", () => {
    it("Return a all List", async () => {
      const result = await cipherService.getAll();

      expect(result.length).toEqual(1);
    });
  });

  describe("get", () => {
    it("exists", async () => {
      const result = await cipherService.get("1");

      expect(result).toEqual({
        id: "1",
        name: {
          encryptedString: "test",
          encryptionType: 0,
        },
        revisionDate: null,
        attachments: null,
        collectionIds: undefined,
        deletedDate: null,
        edit: undefined,
        favorite: undefined,
        fields: null,
        folderId: null,
        localData: null,
        notes: null,
        organizationId: null,
        organizationUseTotp: undefined,
        passwordHistory: null,
        reprompt: undefined,
        type: undefined,
        viewPassword: true,
      });
    });

    it("not exists", async () => {
      const result = await cipherService.get("2");

      expect(result).toBe(undefined);
    });
  });

  it("upsert", async () => {
    await cipherService.upsert(cipherData("2", "test 2"));

    expect(await firstValueFrom(cipherService.ciphers$)).toEqual([
      {
        id: "1",
        name: {
          encryptedString: "test",
          encryptionType: 0,
          decryptedValue: Proxy,
        },
        revisionDate: null,
        attachments: null,
        collectionIds: undefined,
        deletedDate: null,
        edit: undefined,
        favorite: undefined,
        fields: null,
        folderId: null,
        localData: null,
        notes: null,
        organizationId: null,
        organizationUseTotp: undefined,
        passwordHistory: null,
        reprompt: undefined,
        type: undefined,
        viewPassword: true,
      },
      {
        id: "2",
        name: {
          encryptedString: "test 2",
          encryptionType: 0,
          decryptedValue: Proxy,
        },
        revisionDate: null,
        attachments: null,
        collectionIds: undefined,
        deletedDate: null,
        edit: undefined,
        favorite: undefined,
        fields: null,
        folderId: null,
        localData: null,
        notes: null,
        organizationId: null,
        organizationUseTotp: undefined,
        passwordHistory: null,
        reprompt: undefined,
        type: undefined,
        viewPassword: true,
      },
    ]);
    const resp = await firstValueFrom(cipherService.cipherViews$);

    expect(resp[0].id).toEqual("1");
    expect(resp[1].id).toEqual("2");
  });

  it("replace", async () => {
    await cipherService.replace({ "2": cipherData("2", "test 2") });

    expect(await firstValueFrom(cipherService.ciphers$)).toEqual([
      {
        id: "2",
        name: {
          decryptedValue: [],
          encryptedString: "test 2",
          encryptionType: 0,
        },
        revisionDate: null,
        attachments: null,
        collectionIds: undefined,
        deletedDate: null,
        edit: undefined,
        favorite: undefined,
        fields: null,
        folderId: null,
        localData: null,
        notes: null,
        organizationId: null,
        organizationUseTotp: undefined,
        passwordHistory: null,
        reprompt: undefined,
        type: undefined,
        viewPassword: true,
      },
    ]);

    const resp = await firstValueFrom(cipherService.cipherViews$);

    expect(resp[0].id).toEqual("2");
  });

  it("delete", async () => {
    await cipherService.delete("1");

    expect((await firstValueFrom(cipherService.ciphers$)).length).toBe(0);

    const resp = await firstValueFrom(cipherService.cipherViews$);

    expect(resp).toEqual([]);
  });

  describe("clearCache", () => {
    it("clearCache", async () => {
      await cipherService.clearCache();

      expect((await firstValueFrom(cipherService.ciphers$)).length).toBe(1);
      expect((await firstValueFrom(cipherService.cipherViews$)).length).toBe(0);
    });

    it("locking should clear", async () => {
      activeAccountUnlocked.next(false);
      // Sleep for 100ms to avoid timing issues
      await new Promise((r) => setTimeout(r, 100));

      expect((await firstValueFrom(cipherService.ciphers$)).length).toBe(0);
      expect((await firstValueFrom(cipherService.cipherViews$)).length).toBe(0);
    });
  });

  describe("clear", () => {
    it("null userId", async () => {
      await cipherService.clear();

      stateService.received(1).setEncryptedCiphers(Arg.any(), Arg.any());

      expect((await firstValueFrom(cipherService.ciphers$)).length).toBe(0);
      expect((await firstValueFrom(cipherService.cipherViews$)).length).toBe(0);
    });

    it("matching userId", async () => {
      stateService.getUserId().resolves("1");
      await cipherService.clear("1");

      stateService.received(1).setEncryptedCiphers(Arg.any(), Arg.any());

      expect((await firstValueFrom(cipherService.ciphers$)).length).toBe(0);
      expect((await firstValueFrom(cipherService.cipherViews$)).length).toBe(0);
    });

    it("missmatching userId", async () => {
      await cipherService.clear("12");

      stateService.received(1).setEncryptedCiphers(Arg.any(), Arg.any());

      expect((await firstValueFrom(cipherService.ciphers$)).length).toBe(1);
      expect((await firstValueFrom(cipherService.cipherViews$)).length).toBe(1);
    });
  });

  describe("getCipherForUrl", () => {
    let url: string;
    const getAllDecrypted$ = new BehaviorSubject(null);

    beforeEach(() => {
      url = "http://localhost";
      (cipherService as any).cipherViews$ = getAllDecrypted$;

      getAllDecrypted$.next([
        getcipherData("23", "http://localhost"),
        getcipherData("24", "www.google.com"),
      ]);
    });

    it("should return getLastUsedForUrl Id", async () => {
      const actual = await cipherService.getLastUsedForUrl(url, true);

      expect(actual.id).toEqual("23");
    });
  });

  describe("encrypt", () => {
    it("encrypt", async () => {
      const model = new CipherView();
      model.id = "2";
      model.name = "Test Cipher";
      model.organizationId = Utils.newGuid();
      model.type = CipherType.SecureNote;
      model.collectionIds = [Utils.newGuid()];
      model.revisionDate = null;

      cryptoService.encrypt(Arg.any()).resolves(new EncString("ENC"));
      cryptoService.decryptToUtf8(Arg.any()).resolves("DEC");

      const result = await cipherService.encrypt(model);

      expect(result.id).toEqual("2");
      expect(result.collectionIds).toEqual(model.collectionIds);
      expect(result.organizationId).toEqual(model.organizationId);
    });
  });

  function cipherData(id: string, name: string) {
    const data = new CipherData({} as any);
    data.id = id;
    data.name = name;

    return data;
  }

  function getcipherData(id: string, uri: string) {
    let cipherData = new CipherData();
    cipherData = {
      id: id,
      organizationId: "orgId",
      folderId: "folderId",
      edit: true,
      viewPassword: true,
      organizationUseTotp: true,
      favorite: false,
      revisionDate: "2022-01-31T12:00:00.000Z",
      type: CipherType.Login,
      name: "EncryptedString",
      notes: "EncryptedString",
      deletedDate: null,
      reprompt: CipherRepromptType.None,
      login: {
        uris: [{ uri: uri, match: UriMatchType.Exact }],
        username: "EncryptedString",
        password: "EncryptedString",
        passwordRevisionDate: "2022-01-31T12:00:00.000Z",
        totp: "EncryptedString",
        autofillOnPageLoad: false,
      },
      passwordHistory: [{ password: "EncryptedString", lastUsedDate: "2022-01-31T12:00:00.000Z" }],
      attachments: [
        {
          id: "a1",
          url: "url",
          size: "1100",
          sizeName: "1.1 KB",
          fileName: "file",
          key: "EncKey",
        },
        {
          id: "a2",
          url: "url",
          size: "1100",
          sizeName: "1.1 KB",
          fileName: "file",
          key: "EncKey",
        },
      ],
      fields: [
        {
          name: "EncryptedString",
          value: "EncryptedString",
          type: FieldType.Text,
          linkedId: null,
        },
        {
          name: "EncryptedString",
          value: "EncryptedString",
          type: FieldType.Hidden,
          linkedId: null,
        },
      ],
    };

    return cipherData;
  }
});

// eslint-disable-next-line no-restricted-imports
import { Substitute, SubstituteOf, Arg } from "@fluffy-spoon/substitute";
import { MockProxy, mock } from "jest-mock-extended";
import { BehaviorSubject, firstValueFrom } from "rxjs";

import { CryptoService } from "../../../abstractions/crypto.service";
import { EncryptService } from "../../../abstractions/encrypt.service";
import { I18nService } from "../../../abstractions/i18n.service";
import { EncString } from "../../../models/domain/enc-string";
import { ContainerService } from "../../../services/container.service";
import { StateService } from "../../../services/state.service";
import { Guid } from "../../../types/guid";
import { CipherService } from "../../abstractions/cipher.service";
import { FolderData } from "../../models/data/folder.data";
import { Folder } from "../../models/domain/folder";
import { FolderView } from "../../models/view/folder.view";

import { FolderStateService } from "./folder-state.service";
import { FolderService } from "./folder.service";

describe("Folder Service", () => {
  let folderService: FolderService;

  let cryptoService: SubstituteOf<CryptoService>;
  let encryptService: SubstituteOf<EncryptService>;
  let i18nService: SubstituteOf<I18nService>;
  let cipherService: SubstituteOf<CipherService>;
  let stateService: SubstituteOf<StateService>;
  let folderStateService: MockProxy<FolderStateService>;
  let activeAccount: BehaviorSubject<string>;
  let activeAccountUnlocked: BehaviorSubject<boolean>;

  beforeEach(() => {
    cryptoService = Substitute.for();
    encryptService = Substitute.for();
    i18nService = Substitute.for();
    cipherService = Substitute.for();
    stateService = Substitute.for();
    folderStateService = mock();
    activeAccount = new BehaviorSubject("123");
    activeAccountUnlocked = new BehaviorSubject(true);

    folderStateService.getFolderData.mockResolvedValue({
      "1": folderData("1", "test"),
    } as Record<Guid, FolderData>);
    folderStateService.getFolders.mockResolvedValue({
      "1": folder("1", "test"),
    } as Record<Guid, Folder>);
    stateService.activeAccount$.mimicks(() => activeAccount);
    stateService.activeAccountUnlocked$.mimicks(() => activeAccountUnlocked);
    (window as any).bitwardenContainerService = new ContainerService(cryptoService, encryptService);

    folderService = new FolderService(
      cryptoService,
      i18nService,
      cipherService,
      folderStateService,
      stateService
    );
  });

  it("encrypt", async () => {
    const model = new FolderView();
    model.id = "2";
    model.name = "Test Folder";

    cryptoService.encrypt(Arg.any()).resolves(new EncString("ENC"));
    cryptoService.decryptToUtf8(Arg.any()).resolves("DEC");

    const result = await folderService.encrypt(model);

    expect(result).toEqual({
      id: "2",
      name: {
        encryptedString: "ENC",
        encryptionType: 0,
      },
    });
  });

  describe("get", () => {
    it("exists", async () => {
      const result = await folderService.get("1");

      expect(result).toEqual({
        id: "1",
        name: {
          decryptedValue: [],
          encryptedString: "test",
          encryptionType: 0,
        },
        revisionDate: null,
      });
    });

    it("not exists", async () => {
      const result = await folderService.get("2");

      expect(result).toBe(undefined);
    });
  });

  it("upsert", async () => {
    await folderService.upsert(folderData("2", "test 2"));

    expect(await firstValueFrom(folderService.folders$)).toEqual([
      {
        id: "1",
        name: {
          decryptedValue: [],
          encryptedString: "test",
          encryptionType: 0,
        },
        revisionDate: null,
      },
      {
        id: "2",
        name: {
          decryptedValue: [],
          encryptedString: "test 2",
          encryptionType: 0,
        },
        revisionDate: null,
      },
    ]);

    expect(await firstValueFrom(folderService.folderViews$)).toEqual([
      { id: "1", name: [], revisionDate: null },
      { id: "2", name: [], revisionDate: null },
      { id: null, name: [], revisionDate: null },
    ]);
  });

  it("replace", async () => {
    await folderService.replace({ ["2" as Guid]: folderData("2", "test 2") });

    expect(await firstValueFrom(folderService.folders$)).toEqual([
      {
        id: "2",
        name: {
          decryptedValue: [],
          encryptedString: "test 2",
          encryptionType: 0,
        },
        revisionDate: null,
      },
    ]);

    expect(await firstValueFrom(folderService.folderViews$)).toEqual([
      { id: "2", name: [], revisionDate: null },
      { id: null, name: [], revisionDate: null },
    ]);
  });

  it("delete", async () => {
    await folderService.delete("1");

    expect((await firstValueFrom(folderService.folders$)).length).toBe(0);

    expect(await firstValueFrom(folderService.folderViews$)).toEqual([
      { id: null, name: [], revisionDate: null },
    ]);
  });

  it("clearCache", async () => {
    await folderService.clearCache();

    expect((await firstValueFrom(folderService.folders$)).length).toBe(1);
    expect((await firstValueFrom(folderService.folderViews$)).length).toBe(0);
  });

  it("locking should clear", async () => {
    activeAccountUnlocked.next(false);
    // Sleep for 100ms to avoid timing issues
    await new Promise((r) => setTimeout(r, 100));

    expect((await firstValueFrom(folderService.folders$)).length).toBe(0);
    expect((await firstValueFrom(folderService.folderViews$)).length).toBe(0);
  });

  describe("clear", () => {
    it("null userId", async () => {
      await folderService.clear();

      expect(folderStateService.removeFolders).toBeCalledWith(activeAccount.value);
      expect((await firstValueFrom(folderService.folders$)).length).toBe(0);
      expect((await firstValueFrom(folderService.folderViews$)).length).toBe(0);
    });

    it("matching userId", async () => {
      const id = activeAccount.value as Guid;
      await folderService.clear(id);

      expect(folderStateService.removeFolders).toHaveBeenCalledWith(id);

      expect((await firstValueFrom(folderService.folders$)).length).toBe(0);
      expect((await firstValueFrom(folderService.folderViews$)).length).toBe(0);
    });

    it("missmatching userId", async () => {
      const id = "12" as Guid;
      await folderService.clear(id);

      expect(folderStateService.removeFolders).toHaveBeenCalledWith(id);

      expect((await firstValueFrom(folderService.folders$)).length).toBe(1);
      expect((await firstValueFrom(folderService.folderViews$)).length).toBe(2);
    });
  });

  function folderData(id: string, name: string) {
    const data = new FolderData({} as any);
    data.id = id;
    data.name = name;

    return data;
  }

  function folder(id: string, name: string) {
    return new Folder(folderData(id, name));
  }
});

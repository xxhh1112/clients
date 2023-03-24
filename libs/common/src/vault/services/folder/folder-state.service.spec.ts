import { mock, MockProxy } from "jest-mock-extended";

import { StateService } from "../../../abstractions/state.service";
import { storageKey as storageKeyMock } from "../../../misc/storage-key";
import { Guid } from "../../../types/guid";
import { FolderData } from "../../models/data/folder.data";
import { Folder } from "../../models/domain/folder";
import { FolderResponse } from "../../models/response/folder.response";

import { FolderStateServiceImplementation } from "./folder-state.service";

const folderData = new FolderData({
  id: "id",
  name: "name",
  revisionDate: new Date("2020-01-01").toISOString(),
} as FolderResponse);
const folder = new Folder(folderData);

jest.mock("../../../misc/storage-key", () => ({
  storageKey: jest.fn(),
}));

describe("FolderStateService", () => {
  let stateService: MockProxy<StateService>;
  let sut: FolderStateServiceImplementation;
  const userId = "userId" as Guid;
  const storageKey = "storageKey";

  beforeEach(() => {
    stateService = mock();
    stateService.set.mockResolvedValue();
    stateService.get.mockResolvedValue([]);

    (storageKeyMock as any).mockReturnValue(storageKey);
    sut = new FolderStateServiceImplementation(stateService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("setFolders", () => {
    it("should call stateService.set to disk with correct key", async () => {
      const data = { id: folderData };

      await sut.setFolders(userId, data);

      expect(stateService.set).toHaveBeenCalledWith("disk", storageKey, data);
    });

    it("should set storage key with correct key", () => {
      sut.setFolders(userId, {});

      expect(storageKeyMock).toHaveBeenCalledWith(["account", userId], "folder", "folders");
    });

    it("should throw on null userId", () => {
      expect(() => sut.setFolders(null, {})).rejects;
    });

    it("should thrown on null folders", async () => {
      expect(async () => await sut.setFolders(userId, null)).rejects;
    });
  });

  describe("getFolderData", () => {
    it("handles serialized storage", async () => {
      const data = { id: folderData };
      stateService.get.mockResolvedValueOnce(JSON.parse(JSON.stringify(data)));

      const result = await sut.getFolderData(userId);

      expect(result).toEqual(data);
    });

    it("should throw on null userId", () => {
      expect(() => sut.getFolderData(null)).rejects;
    });
  });

  describe("getFolders", () => {
    it("handles converts to domain", async () => {
      const stored = { id: folderData };
      const folders = { id: folder };
      stateService.get.mockResolvedValueOnce(JSON.parse(JSON.stringify(stored)));

      const result = await sut.getFolders(userId);

      expect(result).toEqual(folders);
    });

    it("should throw on null userId", () => {
      expect(() => sut.getFolders(null)).rejects;
    });
  });

  describe("removeFolders", () => {
    it("should call stateService.remove with correct key", async () => {
      await sut.removeFolders(userId);

      expect(stateService.remove).toHaveBeenCalledWith("disk", storageKey);
    });

    it("should throw on null userId", () => {
      expect(() => sut.removeFolders(null)).rejects;
    });
  });
});

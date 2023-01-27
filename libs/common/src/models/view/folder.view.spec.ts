import { mock } from "jest-mock-extended";

import { mockEnc } from "../../../spec/utils";
import { EncryptService } from "../../abstractions/encrypt.service";
import { EncString } from "../domain/enc-string";
import { Folder } from "../domain/folder";

import { FolderView } from "./folder.view";

describe("FolderView", () => {
  describe("fromJSON", () => {
    it("initializes nested objects", () => {
      const revisionDate = new Date("2022-08-04T01:06:40.441Z");
      const actual = FolderView.fromJSON({
        revisionDate: revisionDate.toISOString(),
        name: "name",
        id: "id",
      });

      const expected = {
        revisionDate: revisionDate,
        name: "name",
        id: "id",
      };

      expect(actual).toMatchObject(expected);
    });
  });

  describe("decrypt", () => {
    it("with name", async () => {
      const folder = new Folder();
      folder.id = "id";
      folder.name = mockEnc("encName");
      folder.revisionDate = new Date("2022-01-31T12:00:00.000Z");

      const view = await FolderView.decrypt(null, null, folder);

      expect(view).toEqual({
        id: "id",
        name: "encName",
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
      });
    });

    it("without name", async () => {
      const folder = new Folder();
      folder.id = "id";

      const view = await FolderView.decrypt(null, null, folder);

      expect(view).toEqual({
        id: "id",
      });
    });
  });

  it("encrypt", async () => {
    const view = new FolderView();
    view.id = "2";
    view.name = "Test Folder";
    view.revisionDate = new Date("2022-10-31T10:16:45+00:00");

    const encryptService = mock<EncryptService>();
    encryptService.encrypt.mockResolvedValue(new EncString("ENC"));

    const result = await view.encrypt(encryptService, null);

    expect(result).toEqual({
      id: "2",
      name: {
        encryptedString: "ENC",
        encryptionType: 0,
      },
      revisionDate: new Date("2022-10-31T10:16:45+00:00"),
    });
  });
});

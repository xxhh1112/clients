import { FolderData } from "../data/folder.data";

import { Folder } from "./folder";

describe("Folder", () => {
  let data: FolderData;

  beforeEach(() => {
    data = {
      id: "id",
      name: "encName",
      revisionDate: "2022-01-31T12:00:00.000Z",
    };
  });

  it("Convert", () => {
    const field = new Folder(data);

    expect(field).toEqual({
      id: "id",
      name: { encryptedString: "encName", encryptionType: 0 },
      revisionDate: new Date("2022-01-31T12:00:00.000Z"),
    });
  });

  it("keyIdentifier", () => {
    const folder = new Folder(data);

    expect(folder.keyIdentifier()).toEqual(null);
  });

  describe("fromJSON", () => {
    jest.mock("@bitwarden/common/models/domain/enc-string");

    it("initializes nested objects", () => {
      const revisionDate = new Date("2022-08-04T01:06:40.441Z");
      const actual = Folder.fromJSON({
        revisionDate: revisionDate.toISOString(),
        name: "name",
        id: "id",
      });

      const expected = {
        revisionDate: revisionDate,
        name: {
          encryptedString: "name",
          encryptionType: 0,
        },
        id: "id",
      };

      expect(actual).toMatchObject(expected);
    });
  });
});

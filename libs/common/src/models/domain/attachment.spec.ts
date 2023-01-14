import { AttachmentData } from "../data/attachment.data";

import { Attachment } from "./attachment";

describe("Attachment", () => {
  let data: AttachmentData;

  beforeEach(() => {
    data = {
      id: "id",
      url: "url",
      fileName: "fileName",
      key: "key",
      size: "1100",
      sizeName: "1.1 KB",
    };
  });

  it("Convert from empty", () => {
    const data = new AttachmentData();
    const attachment = new Attachment(data);

    expect(attachment).toEqual({
      id: undefined,
      url: undefined,
      size: undefined,
      sizeName: undefined,
      key: null,
      fileName: null,
    });
  });

  it("Convert", () => {
    const attachment = new Attachment(data);

    expect(attachment).toEqual({
      size: "1100",
      id: "id",
      url: "url",
      sizeName: "1.1 KB",
      fileName: { encryptedString: "fileName", encryptionType: 0 },
      key: { encryptedString: "key", encryptionType: 0 },
    });
  });

  it("toAttachmentData", () => {
    const attachment = new Attachment(data);
    expect(attachment.toAttachmentData()).toEqual(data);
  });

  describe("fromJSON", () => {
    it("initializes nested objects", () => {
      const actual = Attachment.fromJSON({
        key: "myKey",
        fileName: "myFileName",
      });

      expect(actual).toEqual({
        key: { encryptedString: "myKey", encryptionType: 0 },
        fileName: { encryptedString: "myFileName", encryptionType: 0 },
      });
      expect(actual).toBeInstanceOf(Attachment);
    });

    it("returns null if object is null", () => {
      expect(Attachment.fromJSON(null)).toBeNull();
    });
  });
});
